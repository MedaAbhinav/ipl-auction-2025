import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useStore } from '../../store/useStore';
import PlayerPhoto from '../ui/PlayerPhoto';
import TeamLogo from '../ui/TeamLogo';
import Fireworks from '../ui/Fireworks';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

export default function RecordOverlay() {
  const { showRecordOverlay, recordData, iplTeams } = useStore();
  const team = recordData ? iplTeams.find(t => t.id === recordData.teamId) : null;
  const [w, h] = [window.innerWidth, window.innerHeight];

  return (
    <>
      <Fireworks active={showRecordOverlay} />
      <AnimatePresence>
        {showRecordOverlay && recordData && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Golden confetti */}
            <Confetti width={w} height={h} numberOfPieces={350} recycle={false}
              colors={['#f9cd05','#ffb800','#fff','#ff6b35','#ffd700']} />

            {/* Animated golden background */}
            <motion.div className="absolute inset-0"
              animate={{ background: [
                'radial-gradient(ellipse at center, #2d1a0040 0%, #000000ee 70%)',
                'radial-gradient(ellipse at center, #f9cd0530 0%, #000000ee 70%)',
                'radial-gradient(ellipse at center, #2d1a0040 0%, #000000ee 70%)',
              ]}}
              transition={{ duration: 2, repeat: Infinity }} />

            {/* Pulsing rings */}
            {[1, 2, 3].map(i => (
              <motion.div key={i} className="absolute rounded-full border-2 border-stadium-gold/20"
                initial={{ width: 100, height: 100, opacity: .8 }}
                animate={{ width: 600, height: 600, opacity: 0 }}
                transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }} />
            ))}

            {/* Card */}
            <motion.div className="relative z-10 text-center px-6 py-8 max-w-sm w-full mx-4"
              initial={{ scale: .2, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: .2, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 16 }}>

              {/* Crown drop */}
              <motion.div
                initial={{ y: -200, rotate: -30 }} animate={{ y: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: .15 }}
                className="text-6xl mb-2 trophy-bounce">👑</motion.div>

              <motion.h1
                className="text-2xl font-black mb-1 text-gradient-gold glow-text-gold"
                animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                🔥 NEW AUCTION RECORD 🔥
              </motion.h1>
              <p className="text-yellow-300 text-xs font-bold tracking-widest mb-5 uppercase">
                Highest bid in this auction!
              </p>

              {/* Player */}
              <motion.div className="flex justify-center mb-3"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: .3, type:'spring', stiffness:280 }}>
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full"
                    style={{ background: 'conic-gradient(#f9cd05, #ff6b35, #a855f7, #f9cd05)', opacity: .6, filter: 'blur(4px)' }} />
                  <PlayerPhoto src={recordData.player.photo} name={recordData.player.name}
                    size="xl" className="relative border-4 border-stadium-gold animate-pulse-gold" />
                  <div className="absolute -top-2 -right-2 text-2xl">🏆</div>
                </div>
              </motion.div>

              <h2 className="text-xl font-black text-white mb-1">{recordData.player.name}</h2>
              <p className="text-gray-400 text-sm mb-3">{recordData.player.role}</p>

              {team && (
                <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-xl border border-stadium-gold/50"
                     style={{ background: team.primaryColor + '20' }}>
                  <TeamLogo teamId={recordData.teamId} size="sm" />
                  <span className="font-bold text-sm" style={{ color: team.primaryColor }}>{team.name}</span>
                </div>
              )}

              {/* Price display */}
              <motion.div className="rounded-2xl border-2 border-stadium-gold bg-stadium-gold/15 p-4 mb-3"
                animate={{ boxShadow: ['0 0 20px #f9cd0540', '0 0 60px #f9cd0580', '0 0 20px #f9cd0540'] }}
                transition={{ duration: 1.5, repeat: Infinity }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Record Bid</p>
                <p className="text-5xl font-black text-gradient-gold">{fmt(recordData.soldPrice)}</p>
              </motion.div>

              {recordData.prevRecord > 0 && (
                <p className="text-gray-500 text-xs">
                  Previous record: <span className="line-through">{fmt(recordData.prevRecord)}</span>
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
