import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import PlayerPhoto from '../components/ui/PlayerPhoto';
import TeamLogo from '../components/ui/TeamLogo';
import NavBar from '../components/ui/NavBar';
import type { Player, PlayingXI } from '../types';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

const ROLE_COLOR: Record<string, string> = {
  Batsman: '#60a5fa', Bowler: '#f87171',
  'All-rounder': '#c084fc', Wicketkeeper: '#34d399'
};

export default function MyTeamPage() {
  const { code } = useParams<{ code: string }>();
  const { emit } = useSocket();
  const { myTeamId, iplTeams, roomState } = useStore();
  const [squad, setSquad]   = useState<Player[]>([]);
  const [purse, setPurse]   = useState(0);
  const [xi, setXi]         = useState<PlayingXI | null>(null);
  const [view, setView]     = useState<'squad' | 'xi'>('squad');
  const [loadingXI, setLoadingXI] = useState(false);

  const ipl       = iplTeams.find(t => t.id === myTeamId);
  const teamState = myTeamId ? roomState?.teams[myTeamId] : null;
  const settings  = roomState?.settings;

  useEffect(() => {
    if (!code || !myTeamId) return;
    emit('team:get_squad', { roomCode: code, teamId: myTeamId }).then(res => {
      if (res?.success) { setSquad(res.squad); setPurse(res.purse); }
    });
  }, [code, myTeamId, roomState?.soldPlayers?.length]);

  async function getXI() {
    if (!code || !myTeamId) return;
    setLoadingXI(true);
    const res = await emit('team:get_xi', { roomCode: code, teamId: myTeamId });
    setLoadingXI(false);
    if (res?.success) { setXi(res.xi); setView('xi'); }
  }

  const batters   = squad.filter(p => p.role === 'Batsman');
  const bowlers   = squad.filter(p => p.role === 'Bowler');
  const ars       = squad.filter(p => p.role === 'All-rounder');
  const wks       = squad.filter(p => p.role === 'Wicketkeeper');
  const overseas  = squad.filter(p => p.isOverseas);
  const totalSpent= squad.reduce((s, p) => s + (p.soldPrice ?? p.basePrice), 0);
  const squadPct  = Math.min(100, (squad.length / (settings?.maxSquadSize ?? 18)) * 100);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto pb-28"
         style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 0%, #150a2a 0%, #07071a 60%)' }}>

      {/* Team header */}
      {ipl && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="card mb-5 relative overflow-hidden"
          style={{ borderColor: ipl.primaryColor + '60', background: `linear-gradient(145deg, ${ipl.primaryColor}12 0%, #0f0f28 60%)` }}>
          <div className="absolute inset-0 opacity-5"
               style={{ background: `radial-gradient(circle at 0% 50%, ${ipl.primaryColor} 0%, transparent 60%)` }} />
          <div className="relative flex items-center gap-4">
            <TeamLogo teamId={myTeamId!} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black truncate" style={{ color: ipl.primaryColor }}>{ipl.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${squadPct}%` }}
                    transition={{ duration: .8, ease: 'easeOut' }}
                    style={{ background: ipl.primaryColor }} />
                </div>
                <span className="text-xs text-gray-400">{squad.length}/{settings?.maxSquadSize ?? 18}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-3 relative">
            {[
              { label: 'Purse Left',  value: fmt(purse || teamState?.purse || 0), color: '#f9cd05' },
              { label: 'Players',     value: `${squad.length}/${settings?.maxSquadSize ?? 18}`, color: '#60a5fa' },
              { label: 'Overseas',    value: `${overseas.length}/${settings?.maxOverseas ?? 8}`, color: '#fb923c' },
            ].map(s => (
              <div key={s.label} className="bg-black/30 rounded-xl p-2 text-center">
                <p className="font-black text-sm" style={{ color: s.color }}>{s.value}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Role breakdown */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: '🏏 Bat',  count: batters.length, color: '#60a5fa' },
          { label: '🎳 Bowl', count: bowlers.length, color: '#f87171' },
          { label: '⚡ AR',   count: ars.length,     color: '#c084fc' },
          { label: '🧤 WK',   count: wks.length,     color: '#34d399' },
        ].map(r => (
          <div key={r.label} className="card p-2 text-center">
            <p className="font-black text-lg" style={{ color: r.color }}>{r.count}</p>
            <p className="text-gray-500 text-xs">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Spent card */}
      <div className="card mb-4 flex items-center justify-between">
        <span className="text-gray-400 text-sm">Total Spent</span>
        <span className="text-stadium-gold font-black text-xl">{fmt(totalSpent)}</span>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('squad')}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all tap-target ${
            view === 'squad' ? 'btn-primary' : 'btn-secondary'}`}>
          📋 Squad ({squad.length})
        </button>
        <button onClick={getXI} disabled={squad.length === 0}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all tap-target ${
            view === 'xi' ? 'btn-primary' : 'btn-secondary'}`}>
          {loadingXI ? '⏳ Loading…' : '⭐ Best XI'}
        </button>
      </div>

      {/* Squad view */}
      {view === 'squad' && (
        <div className="space-y-2">
          {squad.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card text-center py-10">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-400 font-semibold">No players yet</p>
              <p className="text-gray-600 text-sm mt-1">Bid in the auction to build your squad!</p>
            </motion.div>
          )}
          {squad.map((p, i) => (
            <motion.div key={p.auctionId ?? i}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * .025 }}
              className="card flex items-center gap-3 p-3 card-hover">
              <span className="text-gray-600 text-sm w-5 text-center flex-shrink-0">{i + 1}</span>
              <PlayerPhoto src={p.photo} name={p.name} size="sm" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  <span style={{ color: ROLE_COLOR[p.role] ?? '#aaa' }}>{p.role}</span>
                  {p.isOverseas && <span className="text-orange-400">· 🌍</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-stadium-gold font-black text-sm">{fmt(p.soldPrice ?? p.basePrice)}</p>
                <p className="text-gray-600 text-xs">base {fmt(p.basePrice)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Playing XI view */}
      {view === 'xi' && xi && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-stadium-gold font-black mb-4 flex items-center gap-2">
            ⭐ Best Playing XI
          </h3>
          {xi.xi.map((p, i) => (
            <motion.div key={p.id ?? i}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * .04 }}
              className="flex items-center gap-3 py-2.5 border-b border-white/5">
              <span className="text-gray-600 text-xs w-5">{i + 1}</span>
              <PlayerPhoto src={p.photo} name={p.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  {xi.captain?.id === p.id && (
                    <span className="badge bg-stadium-gold/20 text-stadium-gold border-stadium-gold/30 text-xs">C</span>
                  )}
                  {xi.viceCaptain?.id === p.id && (
                    <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">VC</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{p.role} · {p.nationality}</p>
              </div>
              {p.soldPrice && <span className="text-stadium-gold text-xs font-bold flex-shrink-0">{fmt(p.soldPrice)}</span>}
            </motion.div>
          ))}
          {xi.impactSub && (
            <div className="mt-3 p-3 rounded-xl border border-dashed border-stadium-border">
              <p className="text-xs text-gray-500 mb-2">Impact Substitute</p>
              <div className="flex items-center gap-2">
                <PlayerPhoto src={xi.impactSub.photo} name={xi.impactSub.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{xi.impactSub.name}</p>
                  <p className="text-xs text-gray-500">{xi.impactSub.role}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <NavBar code={code} />
    </div>
  );
}
