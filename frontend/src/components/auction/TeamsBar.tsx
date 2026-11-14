import React from 'react';
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
    <div className="card">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Teams</p>
      <div className="flex flex-wrap gap-2">
        {participants.map(p => {
          const ipl = iplTeams.find(t => t.id === p.teamId);
          const state = teams[p.teamId];
          const isLeading = currentBidder === p.teamId;
          const isMe = myTeamId === p.teamId;

          return (
            <div
              key={p.teamId}
              className={`flex-1 min-w-[120px] p-2 rounded-xl border transition-all duration-200 ${
                isLeading
                  ? 'border-stadium-gold bg-stadium-gold/10 animate-pulse-gold'
                  : isMe
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-stadium-border bg-stadium-dark/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <TeamLogo teamId={p.teamId} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: ipl?.primaryColor ?? '#fff' }}>
                    {ipl?.shortName ?? p.teamId}
                    {isMe && <span className="text-blue-400 ml-1">(You)</span>}
                    {isLeading && <span className="text-stadium-gold ml-1">👑</span>}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{p.name}</p>
                </div>
              </div>

              {state && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="bg-stadium-card/50 rounded p-1 text-center">
                    <p className="text-stadium-gold font-bold">{fmt(state.purse)}</p>
                    <p className="text-gray-600">Purse</p>
                  </div>
                  <div className="bg-stadium-card/50 rounded p-1 text-center">
                    <p className="text-white font-bold">{state.squadSize}/{settings.maxSquadSize}</p>
                    <p className="text-gray-600">Squad</p>
                  </div>
                </div>
              )}

              {!p.connected && (
                <p className="text-xs text-red-400 mt-1">● Disconnected</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
