import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

interface Props {
  teamId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

const sizes = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };

export default function TeamLogo({ teamId, size = 'md', className = '', showName }: Props) {
  const { iplTeams } = useStore();
  const [err, setErr] = useState(false);
  const team = iplTeams.find(t => t.id === teamId);

  if (!team) return (
    <div className={`${sizes[size]} ${className} rounded-full bg-stadium-border flex items-center justify-center text-xs font-bold`}>
      {teamId}
    </div>
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!err ? (
        <img
          src={team.logo}
          alt={team.shortName}
          className={`${sizes[size]} object-contain rounded-full`}
          onError={() => setErr(true)}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center text-xs font-bold border-2`}
          style={{ background: team.primaryColor + '33', borderColor: team.primaryColor, color: team.primaryColor }}
        >
          {team.shortName}
        </div>
      )}
      {showName && <span className="font-semibold text-sm">{team.shortName}</span>}
    </div>
  );
}
