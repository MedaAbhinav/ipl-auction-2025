import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { IPL_TEAMS } from '../data/teams';
import { Sounds } from '../lib/sounds';

/* ── star particle canvas ── */
function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      vy: 0.08 + Math.random() * 0.18,
      alpha: Math.random(),
    }));
    function draw() {
      ctx.clearRect(0, 0, c!.width, c!.height);
      stars.forEach(s => {
        s.y += s.vy; if (s.y > c!.height) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,205,5,${s.alpha * 0.6})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { emit } = useSocket();
  const { setIdentity, setIplTeams, setRoomState } = useStore();

  const [mode, setMode]       = useState<'home' | 'create' | 'join'>('home');
  const [hostName, setHostName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinTeam, setJoinTeam] = useState('');
  const [loading, setLoading]  = useState(false);
  const [maxP, setMaxP]        = useState(10);

  useEffect(() => {
    setIplTeams(IPL_TEAMS as any);
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) { setJoinCode(code.toUpperCase()); setMode('join'); }
  }, []);

  async function createRoom() {
    if (!hostName.trim()) return toast.error('Enter your name first');
    setLoading(true);
    Sounds.join();
    const res = await emit('room:create', { hostName: hostName.trim(), settings: { maxParticipants: maxP } });
    setLoading(false);
    if (!res?.success) return toast.error(res?.error || 'Failed to create room');
    setIdentity(hostName.trim(), null, true, res.roomCode);
    const sr = await emit('room:get_state', { roomCode: res.roomCode });
    if (sr?.success) setRoomState(sr.state);
    navigate(`/lobby/${res.roomCode}`);
  }

  async function joinRoom() {
    if (!joinName.trim()) return toast.error('Enter your name');
    if (!joinCode.trim()) return toast.error('Enter room code');
    if (!joinTeam)        return toast.error('Select a team');
    setLoading(true);
    Sounds.join();
    const res = await emit('room:join', { roomCode: joinCode.trim().toUpperCase(), name: joinName.trim(), teamId: joinTeam });
    setLoading(false);
    if (!res?.success) return toast.error(res?.error || 'Failed to join');
    setIdentity(joinName.trim(), joinTeam, false, joinCode.trim().toUpperCase());
    const sr = await emit('room:get_state', { roomCode: joinCode.trim().toUpperCase() });
    if (sr?.success) setRoomState(sr.state);
    navigate(`/lobby/${joinCode.trim().toUpperCase()}`);
  }

  /* animated code boxes */
  const codeBoxes = (joinCode.padEnd(9, ' ')).split('').slice(0, 9);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-10"
         style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0a35 0%, #07071a 55%)' }}>
      <StarField />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">

          {/* HOME */}
          {mode === 'home' && (
            <motion.div key="home"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              transition={{ duration: .5 }} className="text-center">

              {/* Badge */}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: .1, type:'spring', stiffness:300 }}>
                <span className="badge bg-stadium-gold/15 text-stadium-gold border-stadium-gold/40 text-xs px-4 py-1.5 mb-4 inline-block">
                  🏏 IPL 2025 SEASON
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1 initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2, type:'spring', stiffness:200 }}
                className="text-5xl md:text-6xl font-black mb-3 leading-none glow-text-gold text-gradient-gold">
                AUCTION<br/>GAME
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }}
                className="text-gray-400 text-lg mb-8">
                Real players · Live bidding · AI rankings
              </motion.p>

              {/* Team logo marquee */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}
                className="overflow-hidden mb-8 -mx-4">
                <div className="flex marquee-track gap-4 w-max">
                  {[...IPL_TEAMS, ...IPL_TEAMS].map((t, i) => (
                    <div key={i} className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                      <img src={t.logo} alt={t.shortName} className="w-10 h-10 object-contain"
                           onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Feature pills */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45 }}
                className="flex flex-wrap justify-center gap-2 mb-8">
                {['₹120Cr Purse','18 Players','8 Overseas','Live Bids','AI Ranks','Mobile Ready'].map(f => (
                  <span key={f} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">{f}</span>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }}
                className="space-y-3">
                <button onClick={() => setMode('create')} className="btn-primary w-full text-xl py-5 tap-target">
                  🎙 Create Auction Room
                </button>
                <button onClick={() => setMode('join')} className="btn-secondary w-full text-xl py-5 tap-target">
                  🔗 Join with Room Code
                </button>
              </motion.div>

              {/* How to */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .65 }}
                className="mt-8 card text-left">
                <p className="text-stadium-gold font-bold text-sm mb-3">⚡ How to Play</p>
                <ol className="space-y-2 text-sm text-gray-400">
                  {['Host creates a room → shares code on WhatsApp',
                    'Friends open this link → pick their IPL team',
                    'Bid on 150+ real IPL 2025 players',
                    'Build the best 18-player squad in ₹120 Cr',
                    'AI evaluates all squads → crowns the champion!'].map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-stadium-gold font-bold">{i+1}.</span>{s}</li>
                  ))}
                </ol>
              </motion.div>
            </motion.div>
          )}

          {/* CREATE */}
          {mode === 'create' && (
            <motion.div key="create"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="card border-gold-gradient card-glow">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🎙</span>
                  <h2 className="text-xl font-black text-white">Create Room</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Your Name (Host)</label>
                    <input value={hostName} onChange={e => setHostName(e.target.value)}
                      placeholder="e.g. Ravi" className="input-field" maxLength={20}
                      onKeyDown={e => e.key === 'Enter' && createRoom()} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Max Players</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[2,4,6,8,10].map(n => (
                        <button key={n} onClick={() => setMaxP(n)}
                          className={`py-2.5 rounded-xl font-bold text-sm transition-all tap-target ${
                            maxP === n ? 'bg-stadium-gold text-black' : 'btn-secondary text-sm py-2.5'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={createRoom} disabled={loading} className="btn-primary w-full py-4 text-lg tap-target">
                    {loading ? <span className="animate-pulse">⏳ Creating…</span> : '🚀 Create Room'}
                  </button>
                  <button onClick={() => setMode('home')} className="btn-secondary w-full py-3 text-sm tap-target">← Back</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* JOIN */}
          {mode === 'join' && (
            <motion.div key="join"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="card border-gold-gradient card-glow">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🔗</span>
                  <h2 className="text-xl font-black text-white">Join Room</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Your Name</label>
                    <input value={joinName} onChange={e => setJoinName(e.target.value)}
                      placeholder="e.g. Priya" className="input-field" maxLength={20} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Room Code</label>
                    {/* animated code boxes */}
                    <div className="flex gap-1.5 justify-center mb-2">
                      {codeBoxes.map((ch, i) => (
                        <div key={i} className={`w-9 h-11 rounded-lg flex items-center justify-center font-black text-lg border transition-all ${
                          ch.trim() ? 'border-stadium-gold text-stadium-gold bg-stadium-gold/10' : 'border-stadium-border text-transparent'}`}>
                          {ch.trim() || '_'}
                        </div>
                      ))}
                    </div>
                    <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. IPL2X7KQ" className="input-field font-mono tracking-widest text-center"
                      maxLength={12} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 block">Select Your IPL Team</label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {IPL_TEAMS.map(team => (
                        <button key={team.id} onClick={() => setJoinTeam(team.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all tap-target ${
                            joinTeam === team.id
                              ? 'border-opacity-100 bg-opacity-10'
                              : 'border-stadium-border bg-stadium-dark/50 hover:border-gray-500'}`}
                          style={joinTeam === team.id ? { borderColor: team.primaryColor, background: team.primaryColor + '18' } : {}}>
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                            <img src={team.logo} alt={team.shortName} className="w-8 h-8 object-contain"
                                 onError={e => { (e.target as HTMLImageElement).style.opacity='0'; }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: joinTeam === team.id ? team.primaryColor : '#ccc' }}>
                            {team.shortName}
                          </span>
                          {joinTeam === team.id && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={joinRoom} disabled={loading} className="btn-primary w-full py-4 text-lg tap-target">
                    {loading ? <span className="animate-pulse">⏳ Joining…</span> : '🏏 Join Auction'}
                  </button>
                  <button onClick={() => setMode('home')} className="btn-secondary w-full py-3 text-sm tap-target">← Back</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
