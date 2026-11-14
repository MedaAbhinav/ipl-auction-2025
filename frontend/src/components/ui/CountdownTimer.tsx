import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer';

export default function CountdownTimer({ totalSeconds = 25 }: { totalSeconds?: number }) {
  const { secondsLeft, isWarning } = useTimer();
  const prevRef = useRef(secondsLeft);

  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const frac   = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dash   = circ * frac;

  // color gradient based on time left
  const color = secondsLeft > 10 ? '#22c55e' : secondsLeft > 5 ? '#f9cd05' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-20 h-20 flex-shrink-0">
      {/* Background ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#1c1c42" strokeWidth="6" />
        {/* Animated progress arc */}
        <motion.circle cx="36" cy="36" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          animate={{ stroke: color }}
          transition={{ duration: .3 }}
          style={{ transition: 'stroke-dasharray .25s linear' }} />
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>

      {/* Inner glow circle */}
      <motion.div className="absolute inset-2 rounded-full"
        animate={{ opacity: isWarning ? [.3, .7, .3] : .2 }}
        transition={{ duration: .4, repeat: isWarning ? Infinity : 0 }}
        style={{ background: color, filter: 'blur(6px)' }} />

      {/* Number */}
      <AnimatePresence mode="wait">
        <motion.span key={secondsLeft}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: .6, opacity: 0 }}
          transition={{ duration: .15 }}
          className={`relative z-10 text-2xl font-black ${isWarning ? 'timer-warning' : ''}`}
          style={{ color, textShadow: `0 0 10px ${color}` }}>
          {secondsLeft}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
