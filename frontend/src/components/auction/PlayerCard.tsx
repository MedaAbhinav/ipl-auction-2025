import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import PlayerPhoto from '../ui/PlayerPhoto';
import type { Player } from '../../types';

interface Props { player: Player; large?: boolean; }

const ROLE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Batsman:      { icon: '🏏', color: '#60a5fa', bg: 'rgba(59,130,246,.15)' },
  Bowler:       { icon: '🎳', color: '#f87171', bg: 'rgba(239,68,68,.15)' },
  'All-rounder':{ icon: '⚡', color: '#c084fc', bg: 'rgba(168,85,247,.15)' },
  Wicketkeeper: { icon: '🧤', color: '#34d399', bg: 'rgba(16,185,129,.15)' },
};

const EXP_CONFIG: Record<string, { label: string; color: string }> = {
  Legend:     { label: '👑 LEGEND',    color: '#f9cd05' },
  Senior:     { label: '⭐ SENIOR',    color: '#60a5fa' },
  'Mid-career':{ label: '🔵 MID',     color: '#34d399' },
  Young:      { label: '🌱 YOUNG',    color: '#fb923c' },
};

const FLAG: Record<string, string> = {
  Indian: '🇮🇳', Australia: '🇦🇺', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'West Indies': '🏝️',
  Afghanistan: '🇦🇫', Zimbabwe: '🇿🇼', Bangladesh: '🇧🇩',
  'Sri Lanka': '🇱🇰', Pakistan: '🇵🇰', Singapore: '🇸🇬',
};

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)}Cr`;
  return `₹${n}L`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full"
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: .8, ease: 'easeOut' }}
        style={{ background: color }} />
    </div>
  );
}

export default function PlayerCard({ player, large = false }: Props) {
  const { watchlist, toggleWatchlist } = useStore();
  const isWatched = watchlist.has(player.auctionId);
  const role = ROLE_CONFIG[player.role] ?? ROLE_CONFIG.Batsman;
  const exp  = EXP_CONFIG[player.experience] ?? EXP_CONFIG.Young;
  const isLegend = player.experience === 'Legend';

  return (
    <motion.div
      className={`player-reveal relative overflow-hidden rounded-2xl border transition-all duration-200 card-hover ${
        isLegend ? 'border-gold-gradient' : ''
      }`}
      style={{
        background: 'linear-gradient(145deg, #0f0f28 0%, #12122e 100%)',
        border: isLegend ? undefined : '1.5px solid #1c1c42',
        boxShadow: isLegend ? '0 0 30px rgba(249,205,5,.12)' : undefined
      }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${role.color}22` }}
      whileTap={{ scale: .98 }}
    >
      {/* Legend shimmer overlay */}
      {isLegend && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(249,205,5,.04) 0%, transparent 50%, rgba(249,205,5,.04) 100%)' }} />
      )}

      <div className={`p-${large ? '5' : '4'} ${large ? 'flex flex-col items-center gap-4' : 'flex gap-3'}`}>
        
        {/* Photo section */}
        <div className="relative flex-shrink-0">
          {/* Spotlight ring for large view */}
          {large && (
            <motion.div className="absolute -inset-3 rounded-full bid-ring"
              style={{ border: `2px solid ${role.color}` }} />
          )}
          <PlayerPhoto src={player.photo} name={player.name}
            size={large ? 'xl' : 'lg'}
            className={`${large ? 'border-4' : 'border-2'}`}
            style={{ borderColor: isLegend ? '#f9cd05' : role.color } as any} />
          {/* Flag badge */}
          <div className="absolute -bottom-1 -right-1 text-base leading-none select-none">
            {FLAG[player.nationality] || '🌍'}
          </div>
          {isLegend && (
            <div className="absolute -top-1 -left-1 text-sm">👑</div>
          )}
        </div>

        {/* Info section */}
        <div className={`flex-1 min-w-0 ${large ? 'text-center w-full' : ''}`}>
          
          {/* Name + watchlist */}
          <div className={`flex items-start gap-2 mb-1.5 ${large ? 'justify-center' : ''}`}>
            <h3 className={`font-black text-white leading-tight ${large ? 'text-2xl' : 'text-base'}`}>
              {player.name}
            </h3>
            <button onClick={() => toggleWatchlist(player.auctionId)}
              className="text-lg flex-shrink-0 hover:scale-125 active:scale-110 transition-transform"
              title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}>
              {isWatched ? '⭐' : '☆'}
            </button>
          </div>

          {/* Badges row */}
          <div className={`flex flex-wrap gap-1.5 mb-2 ${large ? 'justify-center' : ''}`}>
            <span className="badge text-xs font-bold" style={{ color: role.color, background: role.bg, borderColor: role.color + '50' }}>
              {role.icon} {player.role}
            </span>
            <span className="badge text-xs" style={{ color: exp.color, background: exp.color + '18', borderColor: exp.color + '40' }}>
              {exp.label}
            </span>
            {player.isOverseas && (
              <span className="badge text-xs text-orange-300 bg-orange-500/15 border-orange-500/30">
                🌍 Overseas
              </span>
            )}
          </div>

          {/* Bowling style (if bowler/AR) */}
          {(player.role === 'Bowler' || player.role === 'All-rounder') && (
            <p className={`text-xs text-gray-500 mb-2 ${large ? 'text-center' : ''}`}>
              {player.bowlingStyle}
            </p>
          )}

          {/* Stats with mini bars */}
          <div className={`grid gap-2 mb-3 ${large ? 'grid-cols-3 w-full' : 'grid-cols-3'}`}>
            {[
              { label: 'M',    value: player.stats.matches, max: 250, color: '#60a5fa', display: player.stats.matches },
              { label: player.role === 'Bowler' ? 'Wkts' : 'Runs',
                value: player.role === 'Bowler' ? player.stats.wickets : player.stats.runs,
                max: player.role === 'Bowler' ? 200 : 8000,
                color: role.color,
                display: player.role === 'Bowler' ? player.stats.wickets : player.stats.runs },
              { label: player.role === 'Bowler' ? 'Avg' : 'S/R',
                value: player.role === 'Bowler' ? player.stats.avg : player.stats.sr,
                max: player.role === 'Bowler' ? 50 : 200,
                color: '#f9cd05',
                display: player.role === 'Bowler'
                  ? (player.stats.avg?.toFixed(1) ?? '0')
                  : (player.stats.sr?.toFixed(1) ?? '0') }
            ].map(s => (
              <div key={s.label} className="bg-black/30 rounded-xl p-2 text-center">
                <p className="font-black text-sm" style={{ color: s.color }}>{s.display}</p>
                <p className="text-gray-600 text-xs mb-1">{s.label}</p>
                <MiniBar value={Number(s.value)} max={s.max} color={s.color} />
              </div>
            ))}
          </div>

          {/* Base price */}
          <div className={`flex items-center gap-2 ${large ? 'justify-center' : ''}`}>
            <span className="text-gray-500 text-xs">Base</span>
            <span className="font-black text-sm text-stadium-gold">{fmt(player.basePrice)}</span>
            <span className="text-gray-600 text-xs">· {player.franchise}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
