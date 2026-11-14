import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useStore } from '../../store/useStore';
import PlayerPhoto from '../ui/PlayerPhoto';
import TeamLogo from '../ui/TeamLogo';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

/* Animated counter from base → sold price */
function AnimatedPrice({ target, base }: { target: number; base: number }) {
  const [display, setDisplay] = React.useState(base);
  useEffect(() => {
    let start = base;
    const diff = target - base;
    const steps = 30;
    const stepVal = diff / steps;
    let count = 0;
    const id = setInterval(() => {
      count++;
      start += stepVal;
      setDisplay(Math.round(start / 25) * 25);
      if (count >= steps) { setDisplay(target); clearInterval(id); }
    }, 30);
    return () => clearInterval(id);
  }, [target, base]);
  return <span>{fmt(display)}</span>;
}

export default function SoldOverlay() {
  const { showSoldOverlay, soldOverlayData, iplTeams } = useStore();
  const [w, h] = [window.innerWidth, window.innerHeight];

  const team = soldOverlayData ? iplTeams.find(t => t.id === soldOverlayData.teamId) : null;

  return (
    <AnimatePresence>
      {showSoldOverlay && soldOverlayData && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

          {/* Confetti */}
          <Confetti width={w} height={h} numberOfPieces={220} recycle={false}
            colors={[team?.primaryColor ?? '#f9cd05', '#fff', '#f9cd05', '#ff6b35', '#a855f7']} />

          {/* Backdrop */}
          <motion.div className="absolute inset-0"
            style={{ background: team ? `radial-gradient(ellipse at center, ${team.primaryColor}30 0%, #000000cc 70%)` : 'rgba(0,0,0,.85)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

          {/* Card */}
          <motion.div className="relative z-10 text-center px-6 py-8 max-w-sm w-full mx-4"
            initial={{ scale: .4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: .4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}>

            {/* Hammer + SOLD stamp */}
            <motion.div
              initial={{ y: -120, rotate: -45 }} animate={{ y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: .15 }}
              className="text-6xl mb-2">🔨</motion.div>

            <div className="sold-stamp mb-4">
              <span className="text-5xl font-black tracking-widest"
                style={{ color: '#22c55e', textShadow: '0 0 30px #22c55e, 0 0 60px #22c55e44' }}>
                SOLD!
              </span>
            </div>

            {/* Player photo with team ring */}
            <motion.div className="flex justify-center mb-4"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: .3, type:'spring', stiffness:300 }}>
              <div className="relative">
                <div className="absolute -inset-2 rounded-full animate-pulse-gold"
                     style={{ background: `conic-gradient(${team?.primaryColor ?? '#f9cd05'}, transparent, ${team?.primaryColor ?? '#f9cd05'})` }} />
                <PlayerPhoto src={soldOverlayData.player.photo} name={soldOverlayData.player.name}
                  size="xl" className="relative border-4" style={{ borderColor: team?.primaryColor ?? '#f9cd05' } as any} />
              </div>
            </motion.div>

            <motion.h2 className="text-2xl font-black text-white mb-1"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}>
              {soldOverlayData.player.name}
            </motion.h2>
            <p className="text-gray-400 text-sm mb-4">{soldOverlayData.player.role} · {soldOverlayData.player.nationality}</p>

            {/* Team banner */}
            {team && (
              <motion.div className="flex items-center justify-center gap-3 mb-5 p-3 rounded-2xl border-2"
                style={{ borderColor: team.primaryColor, background: team.primaryColor + '22' }}
                initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .4 }}>
                <TeamLogo teamId={soldOverlayData.teamId} size="md" />
                <div className="text-left">
                  <p className="font-black text-sm" style={{ color: team.primaryColor }}>{team.name}</p>
                  <p className="text-gray-400 text-xs">New Home 🏠</p>
                </div>
              </motion.div>
            )}

            {/* Price */}
            <motion.div className="rounded-2xl p-4 border-2 border-stadium-gold/50 bg-stadium-gold/10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Final Price</p>
              <p className="text-4xl font-black text-gradient-gold">
                <AnimatedPrice target={soldOverlayData.soldPrice} base={soldOverlayData.player.basePrice} />
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
