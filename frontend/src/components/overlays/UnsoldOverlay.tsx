import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import PlayerPhoto from '../ui/PlayerPhoto';

export default function UnsoldOverlay() {
  const { showUnsoldOverlay, unsoldPlayer } = useStore();

  return (
    <AnimatePresence>
      {showUnsoldOverlay && unsoldPlayer && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div className="relative z-10 text-center px-6 py-8 max-w-xs w-full mx-4"
            initial={{ scale: .6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: .6, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}>

            {/* Sad emojis raining */}
            <motion.div className="flex justify-center gap-3 mb-3 text-3xl"
              animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              😢😔😢
            </motion.div>

            {/* Greyed-out photo */}
            <div className="flex justify-center mb-4 relative">
              <div className="relative">
                <PlayerPhoto src={unsoldPlayer.photo} name={unsoldPlayer.name}
                  size="xl" className="grayscale opacity-40 border-4 border-gray-600" />
                {/* UNSOLD stamp */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="unsold-stamp">
                    <span className="font-black text-2xl px-3 py-1 rounded-lg border-3 border-red-500 bg-gray-900/90 text-red-400 rotate-[-12deg] inline-block"
                      style={{ transform: 'rotate(-12deg)', border: '3px solid #ef4444' }}>
                      UNSOLD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-300 mb-1">{unsoldPlayer.name}</h2>
            <p className="text-gray-500 text-sm mb-3">{unsoldPlayer.role} · Base: {unsoldPlayer.basePrice >= 100 ? `₹${(unsoldPlayer.basePrice/100).toFixed(2)}Cr` : `₹${unsoldPlayer.basePrice}L`}</p>

            <div className="card bg-gray-900/80 border-gray-700">
              <p className="text-gray-500 text-sm italic">😔 No bids placed. This player goes unsold.</p>
              <p className="text-gray-600 text-xs mt-1">The host may bring them back in the unsold round.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
