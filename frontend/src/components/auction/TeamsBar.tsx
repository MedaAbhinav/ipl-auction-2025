import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import TeamLogo from '../ui/TeamLogo';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(1)}Cr`;
  return `₹${n}L`;
}

export default function TeamsBar() {
  const { roomState, iplTeams, myTeamId } = useStore();
  if (!roomState) return null;

  const { participants, teams, settings, currentBidder } = roomState;

  return (
    <div className="card card-glow space-y-3">
      <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">🏟️ All Teams</p>
      <div className="grid grid-cols-1 gap-2">
        {participants.map((p, i) => {
          const ipl       = iplTeams.find(t => t.id === p.teamId);
          const state     = teams[p.teamId];
          const isLeading = currentBidder === p.teamId;
          const isMe      = myTeamId === p.teamId;
          const spent     = (settings.initialPurse ?? 12000) - (state?.purse ?? settings.initialPurse);
          const pct       = Math.min(100, ((state?.squadSize ?? 0) / (settings.maxSquadSize ?? 18)) * 100);

          return (
            <motion.div key={p.teamId}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * .04 }}
              className={`relative p-3 rounded-2xl border-2 transition-all ${
                isLeading ? 'animate-pulse-gold' :
                isMe      ? 'border-blue-500/50' :
                            'border-stadium-border'}`}
              style={{
                borderColor: isLeading ? ipl?.primaryColor : isMe ? undefined : '#1c1c42',
                background: isLeading
                  ? (ipl?.primaryColor ?? '#f9cd05') + '12'
                  : isMe ? 'rgba(59,130,246,.06)' : 'rgba(0,0,0,.2)'
              }}>

              {/* Leading badge */}
              {isLeading && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-stadium-gold text-black text-xs font-black px-2 py-0.5 rounded-full z-10">
                  👑 LEADING
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                <TeamLogo teamId={p.teamId} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-black text-sm truncate" style={{ color: ipl?.primaryColor ?? '#fff' }}>
                      {ipl?.shortName ?? p.teamId}
                    </p>
                    {isMe && <span className="text-blue-400 text-xs font-bold">(You)</span>}
                    {!p.connected && <span className="text-red-400 text-xs">● offline</span>}
                  </div>
                  <p className="text-gray-500 text-xs truncate">{p.name}</p>

                  {/* Squad progress bar */}
                  {state && (
                    <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: .6, ease: 'easeOut' }}
                        style={{ background: ipl?.primaryColor ?? '#f9cd05' }} />
                    </div>
                  )}
                </div>

                {/* Stats column */}
                {state && (
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <p className="text-stadium-gold font-black text-sm">{fmt(state.purse)}</p>
                    <p className="text-gray-500 text-xs">{state.squadSize}/{settings.maxSquadSize} players</p>
                    <p className="text-orange-400 text-xs">{state.overseas}/{settings.maxOverseas} 🌍</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
