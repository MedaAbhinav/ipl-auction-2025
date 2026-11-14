'use strict';

const {
  createRoom, getRoom, getRoomBySocketId, saveRoom,
  addParticipant, reconnectParticipant,
  validateBid, startNextPlayer, sellPlayer, endAuction,
  getPublicRoomState, DEFAULT_SETTINGS
} = require('../engine/auctionEngine');
const { generateRoomCode } = require('../utils/roomCode');
const { IPL_TEAMS } = require('../data/teams');
const { generatePlayingXI } = require('../utils/aiRanking');

// Active timers keyed by roomCode
const timers = new Map();

function clearRoomTimer(roomCode) {
  if (timers.has(roomCode)) {
    clearTimeout(timers.get(roomCode));
    timers.delete(roomCode);
  }
}

function startRoomTimer(io, roomCode, seconds) {
  clearRoomTimer(roomCode);
  const endsAt = Date.now() + seconds * 1000;

  const room = getRoom(roomCode);
  if (!room) return;
  room.timerEndsAt = endsAt;
  saveRoom(roomCode, room);

  io.to(roomCode).emit('timer:update', { endsAt, seconds });

  const handle = setTimeout(() => {
    timerExpired(io, roomCode);
  }, seconds * 1000);

  timers.set(roomCode, handle);
}

function timerExpired(io, roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.status !== 'auction') return;

  const result = sellPlayer(room);
  if (!result) return;

  saveRoom(roomCode, room);

  if (result.result === 'sold') {
    io.to(roomCode).emit('player:sold', {
      player: result.player,
      teamId: result.teamId,
      soldPrice: result.soldPrice,
      isRecord: result.isRecord,
      auctionRecord: room.auctionRecord
    });
  } else {
    io.to(roomCode).emit('player:unsold', { player: result.player });
  }

  io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));

  // Auto-advance after 3s
  setTimeout(() => advanceAuction(io, roomCode), 3000);
}

function advanceAuction(io, roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.status !== 'auction') return;

  const nextPlayer = startNextPlayer(room);
  if (!nextPlayer) {
    // Auction pool exhausted
    if (room.unsoldPlayers.length > 0 && room.settings.allowUnsoldRound) {
      room.status = 'unsold_round';
      saveRoom(roomCode, room);
      io.to(roomCode).emit('auction:unsold_round', { unsoldPlayers: room.unsoldPlayers });
      io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));
    } else {
      triggerEndGame(io, roomCode);
    }
    return;
  }

  saveRoom(roomCode, room);
  io.to(roomCode).emit('player:reveal', { player: nextPlayer });
  io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));

  startRoomTimer(io, roomCode, room.settings.timerSeconds);
}

function triggerEndGame(io, roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  clearRoomTimer(roomCode);
  const { rankings, playingXIs, awards } = endAuction(room);
  saveRoom(roomCode, room);

  io.to(roomCode).emit('auction:ended', { rankings, playingXIs, awards });
  io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));
}

// ─── Main handler ─────────────────────────────────────────────────────────────

module.exports = function attachSocketHandlers(io) {

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── CREATE ROOM ──────────────────────────────────────────────────────────
    socket.on('room:create', ({ hostName, settings }, cb) => {
      try {
        const roomCode = generateRoomCode();
        const room = createRoom(socket.id, hostName || 'Host', settings);
        saveRoom(roomCode, room);
        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        socket.data.isHost = true;

        cb({ success: true, roomCode, roomId: room.id, settings: room.settings });
        io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));
      } catch (err) {
        cb({ success: false, error: err.message });
      }
    });

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on('room:join', ({ roomCode, name, teamId }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });
      if (room.status === 'ended') return cb({ success: false, error: 'Auction has ended' });

      const result = addParticipant(room, socket.id, name, teamId);
      if (result.error) return cb({ success: false, error: result.error });

      saveRoom(roomCode, room);
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.teamId = teamId;

      cb({ success: true, teamId, settings: room.settings });
      io.to(roomCode).emit('room:participant_joined', { name, teamId });
      io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));
    });

    // ── GET ROOM STATE ───────────────────────────────────────────────────────
    socket.on('room:get_state', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });
      cb({ success: true, state: getPublicRoomState(room, roomCode), teams: IPL_TEAMS });
    });

    // ── START AUCTION (host only) ────────────────────────────────────────────
    socket.on('auction:start', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });
      if (room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });
      if (room.participants.length < 1) return cb({ success: false, error: 'Need at least 1 participant' });
      if (room.status !== 'lobby') return cb({ success: false, error: 'Already started' });

      room.status = 'auction';
      saveRoom(roomCode, room);

      io.to(roomCode).emit('auction:started', { settings: room.settings });
      cb({ success: true });

      // Kick off first player after a brief delay
      setTimeout(() => advanceAuction(io, roomCode), 1500);
    });

    // ── PLACE BID ────────────────────────────────────────────────────────────
    socket.on('bid:place', ({ roomCode, teamId, amount }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });

      const validation = validateBid(room, teamId, amount);
      if (!validation.valid) return cb({ success: false, error: validation.reason });

      room.currentBid = amount;
      room.currentBidder = teamId;
      room.bidHistory.push({
        teamId, amount, ts: Date.now(),
        teamName: IPL_TEAMS.find(t => t.id === teamId)?.name || teamId
      });

      saveRoom(roomCode, room);

      // Reset timer
      startRoomTimer(io, roomCode, room.settings.timerSeconds);

      io.to(roomCode).emit('bid:updated', {
        teamId, amount,
        teamName: IPL_TEAMS.find(t => t.id === teamId)?.name || teamId,
        nextMinBid: amount + room.settings.bidIncrement
      });

      cb({ success: true });
    });

    // ── QUICK BID BUTTONS (preset increments) ───────────────────────────────
    socket.on('bid:quick', ({ roomCode, teamId, increment }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });

      const base = room.currentBid || (room.currentPlayer ? room.currentPlayer.basePrice : 0);
      const amount = base + (increment || room.settings.bidIncrement);

      const validation = validateBid(room, teamId, amount);
      if (!validation.valid) return cb({ success: false, error: validation.reason });

      room.currentBid = amount;
      room.currentBidder = teamId;
      room.bidHistory.push({ teamId, amount, ts: Date.now(), teamName: IPL_TEAMS.find(t => t.id === teamId)?.name || teamId });
      saveRoom(roomCode, room);

      startRoomTimer(io, roomCode, room.settings.timerSeconds);

      io.to(roomCode).emit('bid:updated', {
        teamId, amount,
        teamName: IPL_TEAMS.find(t => t.id === teamId)?.name || teamId,
        nextMinBid: amount + room.settings.bidIncrement
      });

      cb({ success: true });
    });

    // ── HOST: PAUSE ──────────────────────────────────────────────────────────
    socket.on('auction:pause', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });

      clearRoomTimer(roomCode);
      room.status = 'paused';
      room.timerEndsAt = null;
      saveRoom(roomCode, room);

      io.to(roomCode).emit('auction:paused');
      io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));
      cb({ success: true });
    });

    // ── HOST: RESUME ─────────────────────────────────────────────────────────
    socket.on('auction:resume', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });

      room.status = 'auction';
      saveRoom(roomCode, room);

      io.to(roomCode).emit('auction:resumed');
      startRoomTimer(io, roomCode, room.settings.timerSeconds);
      cb({ success: true });
    });

    // ── HOST: SKIP PLAYER ────────────────────────────────────────────────────
    socket.on('auction:skip', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });
      if (!room.currentPlayer) return cb({ success: false, error: 'No active player' });

      clearRoomTimer(roomCode);
      const skipped = room.currentPlayer;
      room.unsoldPlayers.push({ ...skipped, skipped: true, soldAt: Date.now() });
      room.currentPlayer = null;
      room.currentBid = 0;
      room.currentBidder = null;
      saveRoom(roomCode, room);

      io.to(roomCode).emit('player:skipped', { player: skipped });
      cb({ success: true });

      setTimeout(() => advanceAuction(io, roomCode), 1500);
    });

    // ── HOST: REMOVE PLAYER ──────────────────────────────────────────────────
    socket.on('auction:remove_player', ({ roomCode, auctionId }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });

      room.removedPlayerIds.add(auctionId);
      saveRoom(roomCode, room);
      io.to(roomCode).emit('auction:player_removed', { auctionId });
      cb({ success: true });
    });

    // ── HOST: END GAME ───────────────────────────────────────────────────────
    socket.on('auction:end', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });

      triggerEndGame(io, roomCode);
      cb({ success: true });
    });

    // ── HOST: UNSOLD ROUND – add player back ─────────────────────────────────
    socket.on('auction:add_unsold', ({ roomCode, auctionId }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });

      const idx = room.unsoldPlayers.findIndex(p => p.auctionId === auctionId);
      if (idx === -1) return cb({ success: false, error: 'Player not in unsold list' });

      const [player] = room.unsoldPlayers.splice(idx, 1);
      room.auctionQueue.push(player.auctionId);
      room.status = 'auction';
      saveRoom(roomCode, room);

      io.to(roomCode).emit('auction:resumed');
      cb({ success: true });
      setTimeout(() => advanceAuction(io, roomCode), 1000);
    });

    // ── CHAT ─────────────────────────────────────────────────────────────────
    socket.on('chat:message', ({ roomCode, name, teamId, message, emoji }) => {
      const room = getRoom(roomCode);
      if (!room) return;

      const msg = { id: Date.now(), name, teamId, message: message?.slice(0, 200), emoji, ts: Date.now() };
      room.chatMessages.push(msg);
      if (room.chatMessages.length > 200) room.chatMessages.shift();
      saveRoom(roomCode, room);

      io.to(roomCode).emit('chat:message', msg);
    });

    // ── WATCHLIST (per-socket, ephemeral) ────────────────────────────────────
    socket.on('watchlist:toggle', ({ auctionId }, cb) => {
      if (!socket.data.watchlist) socket.data.watchlist = new Set();
      if (socket.data.watchlist.has(auctionId)) {
        socket.data.watchlist.delete(auctionId);
        cb({ watched: false });
      } else {
        socket.data.watchlist.add(auctionId);
        cb({ watched: true });
      }
    });

    socket.on('watchlist:get', (cb) => {
      cb({ watchlist: [...(socket.data.watchlist || [])] });
    });

    // ── GET MY SQUAD ─────────────────────────────────────────────────────────
    socket.on('team:get_squad', ({ roomCode, teamId }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });
      const team = room.teams[teamId];
      if (!team) return cb({ success: false, error: 'Team not found' });
      cb({ success: true, squad: team.players, purse: team.purse, overseas: team.overseas, indian: team.indian });
    });

    // ── GET PLAYING XI ───────────────────────────────────────────────────────
    socket.on('team:get_xi', ({ roomCode, teamId }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });
      const team = room.teams[teamId];
      if (!team) return cb({ success: false, error: 'Team not found' });
      const xi = generatePlayingXI(team.players);
      cb({ success: true, xi });
    });

    // ── GET ALL TEAMS (compare view) ─────────────────────────────────────────
    socket.on('teams:get_all', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });

      const teamsData = room.participants.map(p => {
        const ipl = IPL_TEAMS.find(t => t.id === p.teamId) || {};
        const teamState = room.teams[p.teamId] || { players: [], purse: room.settings.initialPurse, overseas: 0, indian: 0 };
        return {
          id: p.teamId,
          name: ipl.name || p.teamId,
          logo: ipl.logo,
          primaryColor: ipl.primaryColor,
          ownerName: p.name,
          purse: teamState.purse,
          players: teamState.players,
          overseas: teamState.overseas,
          indian: teamState.indian
        };
      });

      cb({ success: true, teams: teamsData });
    });

    // ── HOST: UPDATE SETTINGS ────────────────────────────────────────────────
    socket.on('room:update_settings', ({ roomCode, settings }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });
      if (room.status !== 'lobby') return cb({ success: false, error: 'Cannot change settings after start' });

      Object.assign(room.settings, settings);
      saveRoom(roomCode, room);
      io.to(roomCode).emit('room:settings_updated', room.settings);
      cb({ success: true, settings: room.settings });
    });

    // ── HOST: KICK PARTICIPANT ───────────────────────────────────────────────
    socket.on('room:kick', ({ roomCode, teamId }, cb) => {
      const room = getRoom(roomCode);
      if (!room || room.hostSocketId !== socket.id) return cb({ success: false, error: 'Not host' });

      const idx = room.participants.findIndex(p => p.teamId === teamId);
      if (idx === -1) return cb({ success: false, error: 'Participant not found' });

      const [kicked] = room.participants.splice(idx, 1);
      delete room.teams[teamId];
      saveRoom(roomCode, room);

      io.to(kicked.socketId).emit('room:kicked');
      io.to(roomCode).emit('room:state', getPublicRoomState(room, roomCode));
      cb({ success: true });
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      const found = getRoomBySocketId(socket.id);
      if (!found) return;

      const { room, roomCode, participant } = found;

      if (participant) {
        participant.connected = false;
        saveRoom(roomCode, room);
        io.to(roomCode).emit('room:participant_disconnected', { teamId: participant.teamId, name: participant.name });
      } else if (room.hostSocketId === socket.id) {
        // Host disconnected – pause auction if running
        if (room.status === 'auction') {
          clearRoomTimer(roomCode);
          room.status = 'paused';
          room.timerEndsAt = null;
          saveRoom(roomCode, room);
          io.to(roomCode).emit('auction:paused');
          io.to(roomCode).emit('room:host_disconnected');
        }
      }
    });

    // ── RECONNECT ────────────────────────────────────────────────────────────
    socket.on('room:reconnect', ({ roomCode, teamId }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });

      const p = room.participants.find(px => px.teamId === teamId);
      if (!p) return cb({ success: false, error: 'Participant not found' });

      p.socketId = socket.id;
      p.connected = true;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.teamId = teamId;
      saveRoom(roomCode, room);

      io.to(roomCode).emit('room:participant_reconnected', { teamId, name: p.name });
      cb({ success: true, state: getPublicRoomState(room, roomCode) });
    });

    // ── HOST RECONNECT ───────────────────────────────────────────────────────
    socket.on('room:host_reconnect', ({ roomCode }, cb) => {
      const room = getRoom(roomCode);
      if (!room) return cb({ success: false, error: 'Room not found' });

      room.hostSocketId = socket.id;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.isHost = true;
      saveRoom(roomCode, room);

      io.to(roomCode).emit('room:host_reconnected');
      cb({ success: true, state: getPublicRoomState(room, roomCode) });
    });
  });
};
