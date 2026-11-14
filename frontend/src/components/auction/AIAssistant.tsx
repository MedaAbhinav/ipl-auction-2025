import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import type { Player } from '../../types';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

function getAdvice(
  player: Player,
  purse: number,
  squadSize: number,
  overseas: number,
  currentBid: number,
  settings: { maxSquadSize: number; maxOverseas: number; initialPurse: number }
): string[] {
  const tips: string[] = [];
  const remaining = settings.maxSquadSize - squadSize;
  const pursePerSlot = remaining > 0 ? purse / remaining : 0;

  // Value analysis
  const baseRatio = currentBid / Math.max(player.basePrice, 1);
  if (baseRatio > 3) tips.push(`⚠️ Bidding ${baseRatio.toFixed(1)}× base price — consider letting go.`);
  else if (baseRatio <= 1.5) tips.push(`✅ Good value — still below 1.5× base price.`);

  // Purse warning
  if (currentBid > purse * 0.4 && squadSize < settings.maxSquadSize - 5) {
    tips.push(`💡 This would use ${Math.round((currentBid / purse) * 100)}% of your remaining purse.`);
  }

  // Overseas limit
  if (player.isOverseas && overseas >= settings.maxOverseas - 1) {
    tips.push(`🌍 You've almost hit the overseas limit (${overseas}/${settings.maxOverseas}).`);
  }

  // Role need
  if (player.role === 'Wicketkeeper' && squadSize > 10) {
    tips.push(`🧤 If you don't have a wicketkeeper yet, this is important.`);
  }
  if (player.role === 'Bowler' && player.stats.wickets > 100) {
    tips.push(`🎳 Experienced bowler with ${player.stats.wickets} career wickets — strong pick.`);
  }
  if (player.experience === 'Legend') {
    tips.push(`👑 Legend-tier player — premium asset for any squad.`);
  }

  // Budget suggestion
  const maxSuggest = Math.min(purse * 0.35, pursePerSlot * 1.5);
  tips.push(`💰 Suggested max bid: ${fmt(Math.round(maxSuggest / 25) * 25)}`);

  return tips.slice(0, 3);
}

export default function AIAssistant() {
  const { roomState, myTeamId } = useStore();
  const [open, setOpen] = useState(false);

  if (!roomState?.currentPlayer || !myTeamId) return null;

  const teamState = roomState.teams[myTeamId];
  if (!teamState) return null;

  const tips = getAdvice(
    roomState.currentPlayer,
    teamState.purse,
    teamState.squadSize,
    teamState.overseas,
    roomState.currentBid || roomState.currentPlayer.basePrice,
    roomState.settings
  );

  return (
    <div className="card border-purple-500/30 bg-purple-500/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
          🤖 AI Bid Assistant
        </span>
        <span className="text-xs text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 space-y-1.5"
          >
            {tips.map((tip, i) => (
              <p key={i} className="text-xs text-gray-300 bg-stadium-dark/60 rounded-lg px-3 py-2">
                {tip}
              </p>
            ))}
            <p className="text-xs text-gray-600 italic mt-1">AI suggestions only — you decide!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
