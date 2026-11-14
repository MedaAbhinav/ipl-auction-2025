import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  id: string; name: string; logo: string; primaryColor: string;
  ownerName: string; purse: number; players: Player[];
  overseas: number; indian: number;
}

export default function AllTeamsPage() {
  const { code }   = useParams<{ code: string }>();
  const { emit }   = useSocket();
  const { iplTeams, roomState } = useStore();
  const [teams, setTeams]       = useState<FullTeam[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    emit('teams:get_all', { roomCode: code }).then(res => {
      if (res?.success) setTeams(res.teams);
    });
  }, [code, roomState?.soldPlayers?.length]);

  const sel    = teams.find(t => t.id === selected);
  const selIpl = sel ? iplTeams.find(x => x.id === sel.id) : null;
  const settings = roomState?.settings;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto pb-28"
         style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 0%, #150a2a 0%, #07071a 60%)' }}>

      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-2xl font-black text-white">🏟️ All Teams</h1>
        <p className="text-gray-400 text-sm mt-0.5">{teams.length} teams · tap to expand</p>
      </motion.div>

      {/* Team cards grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {teams.map((team, i) => {
          const ipl       = iplTeams.find(t => t.id === team.id);
          const isSelected= selected === team.id;
          const pct       = Math.min(100, (team.players.length / (settings?.maxSquadSize ?? 18)) * 100);

          return (
            <motion.button key={team.id}
              initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * .05 }}
              whileHover={{ y: -2, boxShadow: `0 8px 24px ${ipl?.primaryColor ?? '#fff'}22` }}
              whileTap={{ scale: .97 }}
              onClick={() => setSelected(isSelected ? null : team.id)}
              className={`card text-left transition-all border-2 ${isSelected ? '' : 'border-transparent'}`}
              style={isSelected ? { borderColor: ipl?.primaryColor, background: (ipl?.primaryColor ?? '#fff') + '10' } : {}}>

              <div className="flex items-center gap-2 mb-2">
                <TeamLogo teamId={team.id} size="sm" />
                <div className="min-w-0">
                  <p className="font-black text-xs" style={{ color: ipl?.primaryColor ?? '#fff' }}>
                    {ipl?.shortName ?? team.id}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{team.ownerName}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-2">
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: .6, delay: i * .05 }}
                  style={{ background: ipl?.primaryColor ?? '#f9cd05' }} />
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-black/30 rounded-lg p-1.5 text-center">
                  <p className="font-bold text-white">{team.players.length}/{settings?.maxSquadSize ?? 18}</p>
                  <p className="text-gray-600">Squad</p>
                </div>
                <div className="bg-black/30 rounded-lg p-1.5 text-center">
                  <p className="font-bold text-stadium-gold">{fmt(team.purse)}</p>
                  <p className="text-gray-600">Left</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected team detail */}
      <AnimatePresence>
        {sel && selIpl && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="card mb-6 border-2"
            style={{ borderColor: selIpl.primaryColor + '55', background: `linear-gradient(145deg, ${selIpl.primaryColor}10 0%, #0f0f28 60%)` }}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/8">
              <TeamLogo teamId={sel.id} size="lg" />
              <div>
                <h2 className="text-lg font-black" style={{ color: selIpl.primaryColor }}>{selIpl.name}</h2>
                <p className="text-gray-400 text-sm">Owner: {sel.ownerName}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { l: 'Players',  v: sel.players.length, c: selIpl.primaryColor },
                { l: '🇮🇳 Indian', v: sel.indian,   c: '#60a5fa' },
                { l: '🌍 OS',      v: sel.overseas,  c: '#fb923c' },
                { l: 'Purse',    v: fmt(sel.purse),  c: '#f9cd05' },
              ].map(s => (
                <div key={s.l} className="bg-black/30 rounded-xl p-2 text-center">
                  <p className="font-black text-sm" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-gray-600 text-xs">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Role breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { l:'Bat',  c: sel.players.filter(p=>p.role==='Batsman').length,      col:'#60a5fa' },
                { l:'Bowl', c: sel.players.filter(p=>p.role==='Bowler').length,        col:'#f87171' },
                { l:'AR',   c: sel.players.filter(p=>p.role==='All-rounder').length,   col:'#c084fc' },
                { l:'WK',   c: sel.players.filter(p=>p.role==='Wicketkeeper').length,  col:'#34d399' },
              ].map(r => (
                <div key={r.l} className="bg-black/20 rounded-xl p-2 text-center">
                  <p className="font-black text-sm" style={{ color: r.col }}>{r.c}</p>
                  <p className="text-gray-600 text-xs">{r.l}</p>
                </div>
              ))}
            </div>

            {/* Player list */}
            {sel.players.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">No players bought yet</p>
            ) : (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Squad</p>
                <div className="space-y-1.5">
                  {sel.players.map((p, i) => (
                    <motion.div key={p.auctionId ?? i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * .02 }}
                      className="flex items-center gap-2.5 py-1.5 border-b border-white/5">
                      <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                      <PlayerPhoto src={p.photo} name={p.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.role} {p.isOverseas ? '· 🌍' : '· 🇮🇳'}
                        </p>
                      </div>
                      <span className="text-stadium-gold text-xs font-black flex-shrink-0">
                        {fmt(p.soldPrice ?? p.basePrice)}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/8">
                  <span className="text-gray-400 text-sm">Total Spent</span>
                  <span className="text-stadium-gold font-black text-lg">
                    {fmt(sel.players.reduce((s, p) => s + (p.soldPrice ?? p.basePrice), 0))}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
