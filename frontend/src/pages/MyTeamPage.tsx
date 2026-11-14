import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const roleColors: Record<string, string> = {
  Batsman: '#3b82f6', Bowler: '#ef4444',
  'All-rounder': '#a855f7', Wicketkeeper: '#10b981'
};

export default function MyTeamPage() {
  const { code } = useParams<{ code: string }>();
  const { emit } = useSocket();
  const { myTeamId, iplTeams, roomState } = useStore();
  const [squad, setSquad] = useState<Player[]>([]);
  const [purse, setPurse] = useState(0);
  const [xi, setXi] = useState<PlayingXI | null>(null);
  const [view, setView] = useState<'squad' | 'xi'>('squad');

  const team = iplTeams.find(t => t.id === myTeamId);
  const teamState = myTeamId ? roomState?.teams[myTeamId] : null;

  useEffect(() => {
    if (!code || !myTeamId) return;
    emit('team:get_squad', { roomCode: code, teamId: myTeamId }).then(res => {
      if (res?.success) { setSquad(res.squad); setPurse(res.purse); }
    });
  }, [code, myTeamId, roomState]);

  async function getXI() {
    if (!code || !myTeamId) return;
    const res = await emit('team:get_xi', { roomCode: code, teamId: myTeamId });
    if (res?.success) { setXi(res.xi); setView('xi'); }
  }

  const batters = squad.filter(p => p.role === 'Batsman');
  const bowlers = squad.filter(p => p.role === 'Bowler');
  const ars = squad.filter(p => p.role === 'All-rounder');
  const wks = squad.filter(p => p.role === 'Wicketkeeper');
  const overseas = squad.filter(p => p.isOverseas);

  const totalSpent = squad.reduce((s, p) => s + (p.soldPrice ?? p.basePrice), 0);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        {team && (
          <div className="card flex items-center gap-4 p-4"
               style={{ borderColor: team.primaryColor + '55', background: team.primaryColor + '11' }}>
            <TeamLogo teamId={myTeamId!} size="lg" />
            <div className="flex-1">
              <h1 className="text-xl font-black" style={{ color: team.primaryColor }}>{team.name}</h1>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="text-center">
                  <p className="text-stadium-gold font-bold">{fmt(purse || teamState?.purse || 0)}</p>
                  <p className="text-gray-500">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{squad.length}/{roomState?.settings.maxSquadSize ?? 18}</p>
                  <p className="text-gray-500">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-orange-400 font-bold">{overseas.length}/{roomState?.settings.maxOverseas ?? 8}</p>
                  <p className="text-gray-500">Overseas</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Batters', value: batters.length, color: '#3b82f6' },
          { label: 'Bowlers', value: bowlers.length, color: '#ef4444' },
          { label: 'AR', value: ars.length, color: '#a855f7' },
          { label: 'WK', value: wks.length, color: '#10b981' }
        ].map(s => (
          <div key={s.label} className="card p-2 text-center">
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total spent */}
      <div className="card mb-4 flex items-center justify-between">
        <span className="text-gray-400 text-sm">Total Spent</span>
        <span className="text-stadium-gold font-black text-lg">{fmt(totalSpent)}</span>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('squad')}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            view === 'squad' ? 'bg-stadium-gold text-black' : 'btn-secondary'
          }`}
        >
          📋 Full Squad ({squad.length})
        </button>
        <button
          onClick={getXI}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            view === 'xi' ? 'bg-stadium-gold text-black' : 'btn-secondary'
          }`}
        >
          ⭐ Best XI
        </button>
      </div>

      {/* Squad view */}
      {view === 'squad' && (
        <div className="space-y-2">
          {squad.length === 0 && (
            <div className="card text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-gray-400">No players bought yet. Bid in the auction!</p>
            </div>
          )}
          {squad.map((p, i) => (
            <motion.div
              key={p.auctionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card flex items-center gap-3 p-3"
            >
              <span className="text-gray-600 text-sm w-5 text-right">{i + 1}</span>
              <PlayerPhoto src={p.photo} name={p.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  <span style={{ color: roleColors[p.role] ?? '#aaa' }}>{p.role}</span>
                  {p.isOverseas && <span className="text-orange-400">• OS</span>}
                  <span className="text-gray-600">• {p.nationality}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-stadium-gold font-black text-sm">{fmt(p.soldPrice ?? p.basePrice)}</p>
                <p className="text-gray-600 text-xs">Base: {fmt(p.basePrice)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Playing XI view */}
      {view === 'xi' && xi && (
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-stadium-gold font-bold mb-3">⭐ Best Playing XI</h3>
            {xi.xi.map((p, i) => (
              <div key={p.auctionId} className="flex items-center gap-3 py-2 border-b border-stadium-border/30">
                <span className="text-gray-600 text-sm w-5">{i + 1}</span>
                <PlayerPhoto src={p.photo} name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    {xi.captain?.id === p.id && <span className="badge bg-stadium-gold/20 text-stadium-gold border-stadium-gold/30 text-xs">C</span>}
                    {xi.viceCaptain?.id === p.id && <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">VC</span>}
                  </div>
                  <p className="text-xs text-gray-400">{p.role}</p>
                </div>
              </div>
            ))}
            {xi.impactSub && (
              <div className="flex items-center gap-3 py-2 mt-2 border border-dashed border-stadium-border rounded-lg p-2">
                <PlayerPhoto src={xi.impactSub.photo} name={xi.impactSub.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{xi.impactSub.name}</p>
                  <p className="text-xs text-gray-400">Impact Sub • {xi.impactSub.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <NavBar code={code} />
    </div>
  );
}
