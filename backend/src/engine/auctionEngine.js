'use strict';

const { AUCTION_POOL } = require('../data/players');
const { evaluateTeams, generatePlayingXI, generateAwards } = require('../utils/aiRanking');

/**
 * In-memory store: roomCode → RoomState
 */
const rooms = new Map();

// ─── Default settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  initialPurse: 12000,      // ₹120 crore in lakhs
  maxSquadSize: 18,
  maxOverseas: 8,
  bidIncrement: 25,         // lakhs
  timerSeconds: 25,
  maxParticipants: 10,
  allowUnsoldRound: true,
  soundEnabled: true
};

// ─── Room helpers ─────────────────────────────────────────────────────────────

function createRoom(hostSocketId, hostName, settings = {}) {
  const roomSettings = { ...DEFAULT_SETTINGS, ...settings };
  const players = shuffleArray([...AUCTION_POOL]);

  const room = {
    id: require('uuid').v4(),
    hostSocketId,
    hostName,
    settings: roomSettings,
    status: 'lobby',           // lobby | auction | paused | unsold_round | ended
    participants: [],
    teams: {},                 // teamId → TeamState
    auctionQueue: players.map(p => p.auctionId),
    currentPlayerIndex: 0,
    currentPlayer: null,
    currentBid: 0,
    currentBidder: null,       // teamId
    bidHistory: [],
    soldPlayers: [],
    unsoldPlayers: [],
    removedPlayerIds: new Set(),
    timerEndsAt: null,
    timerHandle: null,
    auctionRecord: { price: 0, player: null, teamId: null },
    chatMessages: [],
    createdAt: Date.now()
  };

  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

function getRoomBySocketId(socketId) {
  for (const [code, room] of rooms) {
    const participant = room.participants.find(p => p.socketId === socketId);
    if (participant) return { room, roomCode: code, participant };
    if (room.hostSocketId === socketId) return { room, roomCode: code, participant: null };
  }
  return null;
}

function saveRoom(roomCode, room) {
  rooms.set(roomCode, room);
}

function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

function getAllRooms() {
  return rooms;
}

// ─── Participant / team helpers ───────────────────────────────────────────────

function addParticipant(room, socketId, name, teamId) {
  // Check capacity
  if (room.participants.length >= room.settings.maxParticipants) {
    return { error: 'Room is full' };
  }
  // Check duplicate team
  if (room.participants.some(p => p.teamId === teamId)) {
    return { error: 'Team already taken' };
  }
  // Check duplicate socket
  if (room.participants.some(p => p.socketId === socketId)) {
    return { error: 'Already joined' };
  }

  const participant = { socketId, name, teamId, joinedAt: Date.now(), connected: true };
  room.participants.push(participant);

  if (!room.teams[teamId]) {
    room.teams[teamId] = {
      id: teamId,
      purse: room.settings.initialPurse,
      players: [],
      overseas: 0,
      indian: 0
    };
  }

  return { participant };
}

function reconnectParticipant(room, oldSocketId, newSocketId) {
  const p = room.participants.find(p => p.socketId === oldSocketId);
  if (p) {
    p.socketId = newSocketId;
    p.connected = true;
    return p;
  }
  return null;
}

// ─── Bid validation ───────────────────────────────────────────────────────────

function validateBid(room, teamId, bidAmount) {
  const team = room.teams[teamId];
  if (!team) return { valid: false, reason: 'Unknown team' };
  if (room.status !== 'auction') return { valid: false, reason: 'Auction not active' };
  if (!room.currentPlayer) return { valid: false, reason: 'No player on auction' };

  const minBid = room.currentBid === 0
    ? room.currentPlayer.basePrice
    : room.currentBid + room.settings.bidIncrement;

  if (bidAmount < minBid) {
    return { valid: false, reason: `Minimum bid is ₹${minBid} lakh` };
  }
  if (bidAmount > team.purse) {
    return { valid: false, reason: 'Insufficient purse' };
  }

  // Squad limits
  const player = room.currentPlayer;
  if (team.players.length >= room.settings.maxSquadSize) {
    return { valid: false, reason: 'Squad is full (18 players)' };
  }
  if (player.isOverseas && team.overseas >= room.settings.maxOverseas) {
    return { valid: false, reason: 'Maximum overseas players (8) reached' };
  }
  if (teamId === room.currentBidder) {
    return { valid: false, reason: 'You are already the highest bidder' };
  }

  return { valid: true, minBid };
}

// ─── Auction flow ─────────────────────────────────────────────────────────────

function getNextPlayer(room) {
  while (room.currentPlayerIndex < room.auctionQueue.length) {
    const auctionId = room.auctionQueue[room.currentPlayerIndex];
    if (!room.removedPlayerIds.has(auctionId) &&
        !room.soldPlayers.find(sp => sp.auctionId === auctionId)) {
      const player = AUCTION_POOL.find(p => p.auctionId === auctionId);
      if (player) return player;
    }
    room.currentPlayerIndex++;
  }
  return null;
}

function startNextPlayer(room) {
  room.currentBid = 0;
  room.currentBidder = null;
  room.bidHistory = [];

  const player = getNextPlayer(room);
  if (!player) return null;

  room.currentPlayer = { ...player };
  room.currentPlayerIndex++;
  return player;
}

function sellPlayer(room) {
  const player = room.currentPlayer;
  if (!player) return null;

  if (!room.currentBidder) {
    // No bids → unsold
    room.unsoldPlayers.push({ ...player, soldAt: Date.now() });
    room.currentPlayer = null;
    return { result: 'unsold', player };
  }

  const team = room.teams[room.currentBidder];
  const soldPrice = room.currentBid;

  const soldEntry = {
    ...player,
    soldPrice,
    soldTo: room.currentBidder,
    soldAt: Date.now()
  };

  team.purse -= soldPrice;
  team.players.push(soldEntry);
  if (player.isOverseas) team.overseas++;
  else team.indian++;

  room.soldPlayers.push(soldEntry);

  // Record check
  let isRecord = false;
  if (soldPrice > room.auctionRecord.price) {
    room.auctionRecord = { price: soldPrice, player: soldEntry, teamId: room.currentBidder };
    isRecord = true;
  }

  room.currentPlayer = null;
  room.currentBid = 0;
  room.currentBidder = null;

  return { result: 'sold', player: soldEntry, teamId: room.currentBidder, soldPrice, isRecord };
}

function endAuction(room) {
  room.status = 'ended';

  const teamList = room.participants
    .map(p => ({ ...room.teams[p.teamId], name: getTeamName(p.teamId) }))
    .filter(Boolean);

  const rankings = evaluateTeams(teamList, room.settings);

  const playingXIs = {};
  room.participants.forEach(p => {
    const team = room.teams[p.teamId];
    if (team) {
      playingXIs[p.teamId] = generatePlayingXI(team.players);
    }
  });

  const awards = generateAwards(
    room.participants.map(p => ({ ...room.teams[p.teamId], id: p.teamId, name: getTeamName(p.teamId) }))
  );
  awards.totalUnsold = room.unsoldPlayers.length;

  return { rankings, playingXIs, awards };
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

function getTeamName(teamId) {
  const { IPL_TEAMS } = require('../data/teams');
  const t = IPL_TEAMS.find(t => t.id === teamId);
  return t ? t.name : teamId;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getPublicRoomState(room, roomCode) {
  const { IPL_TEAMS } = require('../data/teams');
  return {
    roomCode,
    status: room.status,
    hostName: room.hostName,
    settings: room.settings,
    participants: room.participants.map(p => {
      const team = IPL_TEAMS.find(t => t.id === p.teamId) || {};
      return {
        name: p.name,
        teamId: p.teamId,
        teamName: team.name,
        teamLogo: team.logo,
        connected: p.connected
      };
    }),
    teams: Object.fromEntries(
      Object.entries(room.teams).map(([id, t]) => [id, {
        purse: t.purse,
        squadSize: t.players.length,
        overseas: t.overseas,
        indian: t.indian
      }])
    ),
    currentPlayer: room.currentPlayer,
    currentBid: room.currentBid,
    currentBidder: room.currentBidder,
    bidHistory: room.bidHistory.slice(-20),
    soldPlayers: room.soldPlayers.slice(-10),
    unsoldCount: room.unsoldPlayers.length,
    auctionRecord: room.auctionRecord,
    timerEndsAt: room.timerEndsAt,
    remainingPlayers: room.auctionQueue.length - room.currentPlayerIndex
  };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  getRoomBySocketId,
  saveRoom,
  deleteRoom,
  getAllRooms,
  addParticipant,
  reconnectParticipant,
  validateBid,
  startNextPlayer,
  sellPlayer,
  endAuction,
  getPublicRoomState,
  shuffleArray,
  DEFAULT_SETTINGS
};
