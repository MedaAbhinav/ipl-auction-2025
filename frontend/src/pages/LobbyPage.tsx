import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import TeamLogo from '../components/ui/TeamLogo';
import { Sounds } from '../lib/sounds';

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { emit } = useSocket();
  const { roomState, isHost, myName, myTeamId, iplTeams, setRoomState } = useStore();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied]     = useState<'code'|'link'|null>(null);

  const url = `${window.location.origin}/?room=${code}`;

  useEffect(() => {
    if (!roomState && code) emit('room:get_state', { roomCode: code }).then(r => { if (r?.success) setRoomState(r.state); });
  }, [code]);

  useEffect(() => {
    if (roomState?.status === 'auction' || roomState?.status === 'paused') navigate(`/auction/${code}`);
    if (roomState?.status === 'ended') navigate(`/results/${code}`);
  }, [roomState?.status]);

  async function startAuction() {
    if (!code) return;
    setStarting(true);
    Sounds.reveal();
    const res = await emit('auction:start', { roomCode: code });
    setStarting(false);
    if (!res?.success) toast.error(res?.error || 'Failed to start');
  }

  function copy(type: 'code'|'link') {
    navigator.clipboard.writeText(type === 'code' ? code! : url).then(() => {
      setCopied(type); Sounds.join();
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function shareWhatsApp() {
    const text = `🏏 Join my IPL 2025 Auction Game!\nRoom Code: *${code}*\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function kickParticipant(teamId: string) {
    const res = await emit('room:kick', { roomCode: code, teamId });
    if (!res?.success) toast.error(res?.error || 'Could not kick');
    else toast.success('Participant removed');
  }

  const participants = roomState?.participants ?? [];
  const settings     = roomState?.settings;
  const canStart     = isHost && participants.length >= 1;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto"
         style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, #150a2a 0%, #07071a 60%)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-5">

        {/* Header */}
        <div className="text-center pt-4">
          <motion.div className="text-5xl mb-2 trophy-bounce" animate={{}} transition={{}}>🏟️</motion.div>
          <h1 className="text-2xl font-black text-white">Auction Lobby</h1>
          <p className="text-gray-400 text-sm mt-1">Share the room code with your friends!</p>
        </div>

        {/* Room code card */}
        <motion.div className="card border-gold-gradient card-glow text-center"
          initial={{ scale:.9 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200 }}>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Room Code</p>
          {/* Character boxes */}
          <div className="flex justify-center gap-1.5 mb-4">
            {(code ?? '').split('').map((ch, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * .06, type:'spring', stiffness:300 }}
                className="w-9 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 border-stadium-gold/60 bg-stadium-gold/10 text-stadium-gold">
                {ch}
              </motion.div>
            ))}
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <motion.button onClick={() => copy('code')} whileTap={{ scale:.93 }}
              className={`btn-secondary text-xs py-3 tap-target transition-colors ${copied==='code' ? 'border-green-500/60 text-green-400' : ''}`}>
              {copied==='code' ? '✅ Copied!' : '📋 Copy Code'}
            </motion.button>
            <motion.button onClick={() => copy('link')} whileTap={{ scale:.93 }}
              className={`btn-secondary text-xs py-3 tap-target transition-colors ${copied==='link' ? 'border-green-500/60 text-green-400' : ''}`}>
              {copied==='link' ? '✅ Copied!' : '🔗 Copy Link'}
            </motion.button>
            <motion.button onClick={shareWhatsApp} whileTap={{ scale:.93 }}
              className="tap-target text-xs py-3 rounded-2xl font-semibold border border-green-600/50 bg-green-600/15 text-green-400 hover:bg-green-600/25 transition-all">
              📱 WhatsApp
            </motion.button>
          </div>
        </motion.div>

        {/* Participants */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Players Joined ({participants.length}/{settings?.maxParticipants ?? 10})
            </p>
            {/* Dot indicators */}
            <div className="flex gap-1">
              {Array.from({ length: settings?.maxParticipants ?? 10 }).map((_, i) => (
                <motion.div key={i}
                  animate={i < participants.length ? { scale:[1,1.3,1], backgroundColor:'#22c55e' } : {}}
                  transition={{ delay: i * .05 }}
                  className={`w-2 h-2 rounded-full transition-colors ${i < participants.length ? 'bg-green-400' : 'bg-stadium-border'}`} />
              ))}
            </div>
          </div>

          {participants.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2 animate-bounce">👋</div>
              <p className="text-gray-500 text-sm">Share the code — waiting for friends!</p>
            </div>
          )}

          <div className="space-y-2">
            <AnimatePresence>
              {participants.map((p, i) => {
                const ipl = iplTeams.find(t => t.id === p.teamId);
                const isMe = p.name === myName && p.teamId === myTeamId;
                return (
                  <motion.div key={p.teamId}
                    initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                    exit={{ opacity:0, x:20 }} transition={{ delay: i * .05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isMe ? 'border-blue-500/40 bg-blue-500/8' : 'border-stadium-border bg-black/20'}`}>
                    <TeamLogo teamId={p.teamId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {p.name}
                        {isMe && <span className="text-blue-400 text-xs ml-1">(You)</span>}
                        {!isMe && i === 0 && <span className="text-stadium-gold text-xs ml-1">👑 Host</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: ipl?.primaryColor ?? '#888' }}>{ipl?.name ?? p.teamId}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isHost && !isMe && (
                      <button onClick={() => kickParticipant(p.teamId)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded tap-target">✕</button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Settings summary */}
        {settings && (
          <div className="card">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">⚙️ Auction Settings</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['💰 Purse', `₹${settings.initialPurse / 100}Cr`],
                ['👤 Squad', `${settings.maxSquadSize} players`],
                ['🌍 Overseas', `Max ${settings.maxOverseas}`],
                ['⏱ Timer', `${settings.timerSeconds}s`],
                ['📈 Increment', `₹${settings.bidIncrement}L`],
                ['🔄 Unsold Round', settings.allowUnsoldRound ? 'Yes' : 'No']
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between bg-black/20 rounded-xl px-3 py-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-semibold">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start / waiting */}
        {isHost ? (
          <motion.button onClick={startAuction} disabled={!canStart || starting}
            whileHover={canStart ? { scale:1.02, y:-2 } : {}}
            whileTap={canStart ? { scale:.97 } : {}}
            animate={canStart ? { boxShadow:['0 0 20px rgba(249,205,5,.3)','0 0 50px rgba(249,205,5,.65)','0 0 20px rgba(249,205,5,.3)'] } : {}}
            transition={{ duration:1.8, repeat:Infinity }}
            className="btn-primary w-full py-5 text-xl tap-target">
            {starting ? (
              <span className="flex items-center justify-center gap-2 animate-pulse">
                <span className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                Starting Auction…
              </span>
            ) : canStart ? '🏏 START AUCTION!' : '⏳ Waiting for players…'}
          </motion.button>
        ) : (
          <div className="text-center py-6 card">
            <motion.div className="text-4xl mb-3"
              animate={{ rotate:[0,10,-10,0] }} transition={{ duration:2, repeat:Infinity }}>⏳</motion.div>
            <p className="text-gray-400 font-semibold">Waiting for host to start the auction…</p>
            <p className="text-gray-600 text-sm mt-1">Get ready to bid!</p>
          </div>
        )}

        <div className="pb-8" />
      </motion.div>
    </div>
  );
}
