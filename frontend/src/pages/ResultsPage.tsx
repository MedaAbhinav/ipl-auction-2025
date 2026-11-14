import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import TeamLogo from '../components/ui/TeamLogo';
import PlayerPhoto from '../components/ui/PlayerPhoto';
import Fireworks from '../components/ui/Fireworks';
import NavBar from '../components/ui/NavBar';
import type { TeamRanking, PlayingXI } from '../types';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { emit } = useSocket();
  const { rankings, playingXIs, awards, iplTeams, setEndGameData, setRoomState } = useStore();
  const [selected, setSelected]       = useState<TeamRanking | null>(null);
  const [view, setView]               = useState<'rankings' | 'awards' | 'compare'>('rankings');
  const [compareA, setCompareA]       = useState('');
  const [compareB, setCompareB]       = useState('');
  const [showFetti, setShowFetti]     = useState(true);
  const [showFire, setShowFire]       = useState(true);
  const [revealed, setRevealed]       = useState(false);
  const [w, h]                        = [window.innerWidth, window.innerHeight];

  useEffect(() => {
    if (rankings.length === 0 && code) emit('room:get_state',{roomCode:code}).then(r => { if(r?.success) setRoomState(r.state); });
    const t1 = setTimeout(() => setShowFetti(false), 7000);
    const t2 = setTimeout(() => setShowFire(false),  5000);
    const t3 = setTimeout(() => setRevealed(true),   600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => { if (rankings.length > 0) setSelected(rankings[0]); }, [rankings]);

  const winner    = rankings[0];
  const winnerIpl = winner ? iplTeams.find(t => t.id === winner.teamId) : null;

  if (rankings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="text-5xl mb-3 animate-spin-slow">⏳</div><p className="text-gray-400">Loading results…</p></div>
      </div>
    );
  }

  return (
    <>
      <Fireworks active={showFire} />
      {showFetti && <Confetti width={w} height={h} numberOfPieces={280} recycle={false}
        colors={[winnerIpl?.primaryColor??'#f9cd05','#fff','#f9cd05','#ff6b35','#a855f7']} />}

      <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto pb-28">
        
        {/* Champion banner */}
        {winner && winnerIpl && (
          <motion.div initial={{ opacity:0, scale:.8, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', stiffness:200, damping:18 }}
            className="card mb-6 text-center relative overflow-hidden rank-1 border-2"
            style={{ borderColor: winnerIpl.primaryColor, background: `linear-gradient(145deg, ${winnerIpl.primaryColor}18 0%, #0f0f28 60%)` }}>
            <div className="absolute inset-0 opacity-5"
                 style={{ background: `radial-gradient(circle at 50% 0%, ${winnerIpl.primaryColor} 0%, transparent 70%)` }} />
            <div className="text-5xl mb-2 trophy-bounce">🏆</div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">🎉 Auction Champion</p>
            <TeamLogo teamId={winner.teamId} size="lg" className="justify-center mb-2" />
            <h1 className="text-2xl font-black mb-2" style={{ color: winnerIpl.primaryColor }}>{winnerIpl.name}</h1>
            <div className="flex justify-center gap-3">
              <span className="badge bg-stadium-gold/20 text-stadium-gold border-stadium-gold/40 px-3">
                Score: {winner.score}/100
              </span>
              <span className="badge bg-green-500/20 text-green-400 border-green-500/30 px-3">
                #{winner.rank} Overall
              </span>
            </div>
          </motion.div>
        )}

        {/* View tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(['rankings','awards','compare'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all tap-target ${
                view === v ? 'btn-primary' : 'btn-secondary'}`}>
              {v === 'rankings' ? '🏅 Rankings' : v === 'awards' ? '🏆 Awards' : '⚖️ Compare'}
            </button>
          ))}
        </div>

        {/* RANKINGS */}
        {view === 'rankings' && (
          <div className="space-y-3">
            {rankings.map((r, i) => {
              const ipl = iplTeams.find(t => t.id === r.teamId);
              const isSelected = selected?.teamId === r.teamId;
              return (
                <motion.div key={r.teamId}
                  initial={{ opacity:0, x:-30 }} animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : -30 }}
                  transition={{ delay: i * .08 }}>
                  <button onClick={() => setSelected(isSelected ? null : r)}
                    className={`w-full text-left card card-hover transition-all ${
                      i === 0 ? 'rank-1 border-stadium-gold/60' :
                      i === 1 ? 'rank-2 border-gray-400/30' :
                      i === 2 ? 'rank-3 border-amber-600/30' : ''}`}
                    style={isSelected && ipl ? { borderColor: ipl.primaryColor + '80', background: ipl.primaryColor + '0a' } : {}}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center flex-shrink-0">
                        {i < 3 ? <span className="text-2xl">{MEDALS[i]}</span>
                               : <span className="text-lg font-black text-gray-500">#{r.rank}</span>}
                      </div>
                      <TeamLogo teamId={r.teamId} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm" style={{ color: ipl?.primaryColor ?? '#fff' }}>
                          {ipl?.name ?? r.teamId}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden max-w-24">
                            <motion.div className="h-full rounded-full"
                              initial={{ width:0 }}
                              animate={{ width: revealed ? `${r.score}%` : '0%' }}
                              transition={{ delay: .3 + i * .05, duration:.8, ease:'easeOut' }}
                              style={{ background: ipl?.primaryColor ?? '#f9cd05' }} />
                          </div>
                          <span className="text-xs font-black text-stadium-gold">{r.score}/100</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-white font-semibold">{r.squadSize}/18</p>
                        <p className="text-xs text-gray-500">{fmt(r.remaining)}</p>
                      </div>
                      <span className="text-gray-600 text-xs">{isSelected ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }} className="overflow-hidden">
                        <div className="card mt-1 rounded-t-none border-t-0 space-y-4"
                             style={{ borderColor: ipl?.primaryColor + '40' }}>

                          {/* Score breakdown */}
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">📊 Score Breakdown</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {Object.entries(r.breakdown).map(([k, v]) => (
                                <div key={k} className="flex justify-between bg-black/30 rounded-xl px-3 py-2">
                                  <span className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                                  <span className="text-xs font-bold text-stadium-gold">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2">
                            {[{ l:'Spent', v:fmt(r.totalSpent) }, { l:'🇮🇳 Indian', v:r.indian }, { l:'🌍 Overseas', v:r.overseas }].map(s => (
                              <div key={s.l} className="bg-black/30 rounded-xl p-2 text-center">
                                <p className="text-sm font-bold text-white">{s.v}</p>
                                <p className="text-xs text-gray-500">{s.l}</p>
                              </div>
                            ))}
                          </div>

                          {/* Strengths & Weaknesses */}
                          {r.strengths.length > 0 && (
                            <div>
                              <p className="text-xs text-green-400 font-semibold mb-1">✅ Strengths</p>
                              {r.strengths.map(s => <p key={s} className="text-xs text-gray-300 flex gap-1"><span className="text-green-400">•</span>{s}</p>)}
                            </div>
                          )}
                          {r.weaknesses.length > 0 && (
                            <div>
                              <p className="text-xs text-red-400 font-semibold mb-1">⚠️ Weaknesses</p>
                              {r.weaknesses.map(w => <p key={w} className="text-xs text-gray-300 flex gap-1"><span className="text-red-400">•</span>{w}</p>)}
                            </div>
                          )}

                          {/* Best purchases */}
                          {r.bestPurchases.length > 0 && (
                            <div>
                              <p className="text-xs text-stadium-gold font-semibold mb-1">🌟 Best Purchases</p>
                              {r.bestPurchases.map(p => (
                                <div key={p.name} className="flex justify-between text-xs py-0.5">
                                  <span className="text-gray-300">{p.name} <span className="text-gray-500">({p.role})</span></span>
                                  <span className="text-stadium-gold font-bold">{fmt(p.soldPrice)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {r.squadPenalty > 0 && (
                            <p className="text-xs text-orange-400 bg-orange-500/10 rounded-xl px-3 py-2">
                              ⚠️ Incomplete squad penalty: -{r.squadPenalty} pts
                            </p>
                          )}

                          {/* Playing XI */}
                          {playingXIs[r.teamId] && <PlayingXICard xi={playingXIs[r.teamId]} />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* AWARDS */}
        {view === 'awards' && <AwardsView awards={awards} />}

        {/* COMPARE */}
        {view === 'compare' && (
          <CompareView rankings={rankings} compareA={compareA} compareB={compareB}
            setCompareA={setCompareA} setCompareB={setCompareB} />
        )}

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="btn-primary py-4 px-8 text-lg">
            🏏 Start New Auction
          </button>
        </div>

        <NavBar code={code} />
      </div>
    </>
  );
}

/* ── Playing XI mini card ── */
function PlayingXICard({ xi }: { xi: PlayingXI }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="text-xs text-blue-400 font-semibold flex items-center gap-1">
        {open ? '▲ Hide' : '▼ Show'} Best Playing XI
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            className="overflow-hidden mt-2 space-y-1.5">
            {xi.xi.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-xs py-1 border-b border-white/5">
                <span className="text-gray-600 w-4">{i+1}</span>
                <PlayerPhoto src={p.photo} name={p.name} size="sm" />
                <span className="flex-1 text-gray-200 truncate">{p.name}</span>
                {xi.captain?.id === p.id    && <span className="text-stadium-gold font-black">(C)</span>}
                {xi.viceCaptain?.id === p.id && <span className="text-blue-400 font-black">(VC)</span>}
                <span className="text-gray-600">{p.role.slice(0,3)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Awards ── */
function AwardsView({ awards }: { awards: Record<string, any> }) {
  const { iplTeams } = useStore();
  if (!awards || !Object.keys(awards).length)
    return <p className="text-gray-500 text-center py-8">No awards data yet.</p>;

  const items = [
    { icon:'💰', label:'Most Expensive Player', key:'mostExpensivePlayer', player:true },
    { icon:'🤑', label:'Best Bargain',           key:'bestBargain',         player:true },
    { icon:'🏏', label:'Best Batter Purchase',   key:'bestBatterPurchase',  player:true },
    { icon:'🎳', label:'Best Bowler Purchase',   key:'bestBowlerPurchase',  player:true },
    { icon:'⚡', label:'Best All-rounder',        key:'bestAllRounder',      player:true },
    { icon:'💸', label:'Highest Spending Team',  key:'highestSpendingTeam', team:true },
    { icon:'🧠', label:'Most Economical Team',   key:'mostEconomicalTeam',  team:true },
  ];

  return (
    <div className="space-y-3">
      {items.map((a, i) => {
        const data = awards[a.key]; if (!data) return null;
        const ipl = data.teamId ? iplTeams.find(t => t.id === data.teamId) : null;
        return (
          <motion.div key={a.key} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i * .07 }} className="card flex items-center gap-3">
            <span className="text-3xl flex-shrink-0">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{a.label}</p>
              {a.player && (
                <>
                  <p className="font-black text-white truncate">{data.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{data.role}</span>
                    {ipl && <><TeamLogo teamId={data.teamId} size="xs" /><span className="text-xs" style={{ color:ipl.primaryColor }}>{ipl.shortName}</span></>}
                  </div>
                </>
              )}
              {(a as any).team && (
                <div className="flex items-center gap-2 mt-1">
                  <TeamLogo teamId={data.teamId} size="sm" />
                  <div>
                    <p className="font-black text-white text-sm">{ipl?.name ?? data.teamId}</p>
                    <p className="text-xs text-gray-400">{fmt(data.spent)}</p>
                  </div>
                </div>
              )}
            </div>
            {data.soldPrice && <span className="text-stadium-gold font-black text-sm flex-shrink-0">{fmt(data.soldPrice)}</span>}
          </motion.div>
        );
      })}
      <div className="card">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Auction Summary</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/30 rounded-xl p-2"><p className="text-stadium-gold font-bold">{fmt(awards.totalAuctionSpend??0)}</p><p className="text-gray-500">Total Spent</p></div>
          <div className="bg-black/30 rounded-xl p-2"><p className="text-white font-bold">{fmt(awards.averagePlayerPrice??0)}</p><p className="text-gray-500">Avg Price</p></div>
        </div>
      </div>
    </div>
  );
}

/* ── Compare ── */
function CompareView({ rankings, compareA, compareB, setCompareA, setCompareB }: {
  rankings: TeamRanking[]; compareA:string; compareB:string;
  setCompareA:(v:string)=>void; setCompareB:(v:string)=>void;
}) {
  const { iplTeams } = useStore();
  const a = rankings.find(r => r.teamId === compareA);
  const b = rankings.find(r => r.teamId === compareB);
  const iplA = compareA ? iplTeams.find(t => t.id === compareA) : null;
  const iplB = compareB ? iplTeams.find(t => t.id === compareB) : null;

  const metrics = [
    { key:'score', label:'Overall Score', max:100 },
    { key:'squadSize', label:'Squad Size', max:18 },
    { key:'overseas', label:'Overseas', max:8 },
    { key:'indian', label:'Indian Players', max:15 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[{ label:'Team A', val:compareA, set:setCompareA, ipl:iplA }, { label:'Team B', val:compareB, set:setCompareB, ipl:iplB }].map(({ label, val, set, ipl }) => (
          <div key={label}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <select value={val} onChange={e => set(e.target.value)}
              className="input-field text-sm py-2.5"
              style={{ borderColor: ipl?.primaryColor ?? '' }}>
              <option value="">Select team</option>
              {rankings.map(r => { const t = iplTeams.find(x => x.id === r.teamId); return <option key={r.teamId} value={r.teamId}>{t?.shortName ?? r.teamId} (#{r.rank})</option>; })}
            </select>
          </div>
        ))}
      </div>

      {a && b && (
        <div className="space-y-3">
          {metrics.map(m => {
            const va = Number((a as any)[m.key]??0);
            const vb = Number((b as any)[m.key]??0);
            const pA = Math.min(100, (va/m.max)*100);
            const pB = Math.min(100, (vb/m.max)*100);
            return (
              <div key={m.key} className="card">
                <p className="text-xs text-gray-400 text-center mb-2">{m.label}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black w-12 text-right" style={{ color: iplA?.primaryColor }}>{va}</span>
                  <div className="flex-1 relative h-3 bg-black/40 rounded-full overflow-hidden flex">
                    <motion.div className="h-full rounded-l-full" initial={{ width:0 }}
                      animate={{ width:`${pA/2}%` }} style={{ background: iplA?.primaryColor??'#888' }} />
                    <div className="flex-1" />
                    <motion.div className="h-full rounded-r-full" initial={{ width:0 }}
                      animate={{ width:`${pB/2}%` }} style={{ background: iplB?.primaryColor??'#444', marginLeft:'auto' }} />
                  </div>
                  <span className="text-sm font-black w-12" style={{ color: iplB?.primaryColor }}>{vb}</span>
                </div>
              </div>
            );
          })}
          <div className="card">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Detailed Breakdown</p>
            {Object.keys(a.breakdown).map(k => {
              const va = a.breakdown[k]??0; const vb = b.breakdown[k]??0;
              const winner = va > vb ? 'A' : vb > va ? 'B' : '=';
              return (
                <div key={k} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                  <span className="text-xs text-gray-500 w-28 capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                  <span className="text-xs font-bold w-8 text-right" style={{ color: winner==='A' ? iplA?.primaryColor : '#555' }}>{va}</span>
                  <div className="flex-1 text-center text-xs text-gray-600">vs</div>
                  <span className="text-xs font-bold w-8" style={{ color: winner==='B' ? iplB?.primaryColor : '#555' }}>{vb}</span>
                  <span className="text-xs">{winner==='A'?'◀':winner==='B'?'▶':'='}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(!compareA||!compareB) && <p className="text-gray-600 text-center py-8">Select two teams to compare</p>}
    </div>
  );
}
