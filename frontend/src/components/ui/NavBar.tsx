import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface Props { code?: string; }

export default function NavBar({ code }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { myTeamId, isHost, roomState } = useStore();

  if (!code) return null;

  const status = roomState?.status;
  const inAuction = status === 'auction' || status === 'paused' || status === 'unsold_round';
  const ended     = status === 'ended';

  const links = [
    { path: `/auction/${code}`,  label: 'Auction',  icon: '🔨', show: inAuction || ended },
    { path: `/myteam/${code}`,   label: 'My Team',  icon: '🏏', show: !!myTeamId },
    { path: `/teams/${code}`,    label: 'All Teams',icon: '🏟️', show: true },
    { path: `/results/${code}`,  label: 'Results',  icon: '🏆', show: ended },
    { path: `/settings`,         label: 'Settings', icon: '⚙️', show: true }
  ].filter(l => l.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-stadium-dark/95 backdrop-blur-sm border-t border-stadium-border pb-safe max-w-2xl mx-auto">
      <div className="flex">
        {links.map(l => {
          const active = location.pathname === l.path;
          return (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs transition-colors ${
                active ? 'text-stadium-gold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-lg leading-none">{l.icon}</span>
              <span className="font-semibold">{l.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
