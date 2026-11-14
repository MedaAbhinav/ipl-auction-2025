import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import TeamLogo from '../components/ui/TeamLogo';
import PlayerPhoto from '../components/ui/PlayerPhoto';
import NavBar from '../components/ui/NavBar';
import type { Player } from '../types';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

interface FullTeam {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  ownerName: string;
  purse: number;
  players: Player[];
  overseas: number;
  indian: number;
}

export default function AllTeamsPage() {
  const { code } = useParams<{ code: string }>();
  const { emit } = useSocket();
  const { iplTeams, roomState } = useStore();
  const [teams, setTeams] = useState<FullTeam[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    emit('teams:get_all', { roomCode: code }).then(res => {
      if (res?.success) setTeams(res.teams);
    });
  }, [code, roomState]);

  const selectedTeam = teams.find(t => t.id === selected);
  const ipl = selectedTeam ? iplTeams.find(x => x.id === selectedTeam.id) : null;

  const settings = roomState?.settings;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-2xl font-black text-white mb-1">🏏 All Teams</h1>
        <p className="text-gray-400 text-sm">{teams.length} teams in this auction</p>
      </motion.div>

      {/* Team grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {teams.map((team, i) => {
          const iplTeam = iplTeams.find(t => t.id === team.id);
          const isSelected = selected === team.id;
          const pct = (team.players.length / (settings?.maxSquadSize ?? 18)) * 100;

          return (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(isSelected ? null : team.id)}
              className={`card text-left transition-all duration-200 ${
                isSelected ? 'border-stadium-gold' : ''
              }`}
              style={isSelected ? { borderColor: iplTeam?.primaryColor, background: (iplTeam?.primaryColor ?? '#fff') + '11' } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                <TeamLogo teamId={team.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate" style={{ color: iplTeam?.primaryColor ?? '#fff' }}>
                    {iplTeam?.shortName ?? team.id}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{team.ownerName}</p>
                </div>
              </div>

              {/* Squad bar */}
              <div className="bg-stadium-dark rounded-full h-1.5 mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: iplTeam?.primaryColor ?? '#f9cd05' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-stadium-dark/60 rounded p-1 text-center">
                  <p className="text-white font-bold">{team.players.length}/{settings?.maxSquadSize ?? 18}</p>
                  <p className="text-gray-600">Squad</p>
                </div>
                <div className="bg-stadium-dark/60 rounded p-1 text-center">
                  <p className="text-stadium-gold font-bold">{fmt(team.purse)}</p>
                  <p className="text-gray-600">Purse</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected team detail */}
      {selectedTeam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
          style={{ borderColor: ipl?.primaryColor + '55' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stadium-border">
            <TeamLogo teamId={selectedTeam.id} size="lg" />
            <div>
              <h2 className="text-lg font-black" style={{ color: ipl?.primaryColor ?? '#fff' }}>
                {ipl?.name ?? selectedTeam.id}
              </h2>
              <p className="text-gray-400 text-sm">Owner: {selectedTeam.ownerName}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Players', value: selectedTeam.players.length },
              { label: 'Indian', value: selectedTeam.indian },
              { label: 'Overseas', value: selectedTeam.overseas },
              { label: 'Purse Left', value: fmt(selectedTeam.purse) }
            ].map(s => (
              <div key={s.label} className="bg-stadium-dark/50 rounded-lg p-2 text-center">
                <p className="font-bold text-sm" style={{ color: ipl?.primaryColor ?? '#f9cd05' }}>{s.value}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Bat', count: selectedTeam.players.filter(p => p.role === 'Batsman').length, color: '#3b82f6' },
              { label: 'Bowl', count: selectedTeam.players.filter(p => p.role === 'Bowler').length, color: '#ef4444' },
              { label: 'AR', count: selectedTeam.players.filter(p => p.role === 'All-rounder').length, color: '#a855f7' },
              { label: 'WK', count: selectedTeam.players.filter(p => p.role === 'Wicketkeeper').length, color: '#10b981' }
            ].map(c => (
              <div key={c.label} className="bg-stadium-dark/50 rounded-lg p-2 text-center">
                <p className="font-bold text-sm" style={{ color: c.color }}>{c.count}</p>
                <p className="text-gray-500 text-xs">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Player list */}
          {selectedTeam.players.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">No players bought yet</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Squad</p>
              {selectedTeam.players.map((p, i) => (
                <div key={p.auctionId ?? i} className="flex items-center gap-2.5 py-1.5 border-b border-stadium-border/20">
                  <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                  <PlayerPhoto src={p.photo} name={p.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.role} {p.isOverseas ? '• 🌍 Overseas' : '• 🇮🇳'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-stadium-gold text-xs font-bold">{fmt(p.soldPrice ?? p.basePrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total spent */}
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-stadium-border">
            <span className="text-gray-400 text-sm">Total Spent</span>
            <span className="text-stadium-gold font-black">
              {fmt(selectedTeam.players.reduce((s, p) => s + (p.soldPrice ?? p.basePrice), 0))}
            </span>
          </div>
        </motion.div>
      )}

      {teams.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏟️</div>
          <p className="text-gray-400">No teams joined yet</p>
        </div>
      )}
      <NavBar code={code} />
    </div>
  );
}
