import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';

export default function HostControls() {
  const { roomState, isHost } = useStore();
  const { emit } = useSocket();
  const [loading, setLoading] = useState('');
  const [open, setOpen] = useState(false);

  if (!isHost || !roomState) return null;

  const { status, roomCode } = roomState;

  async function action(type: string, payload?: Record<string, unknown>) {
    setLoading(type);
    const res = await emit(type, { roomCode, ...payload });
    setLoading('');
    if (!res?.success) toast.error(res?.error || 'Action failed');
    else {
      const labels: Record<string, string> = {
        'auction:pause':  '⏸ Paused',
        'auction:resume': '▶️ Resumed',
        'auction:skip':   '⏭ Player skipped',
      };
      if (labels[type]) toast.success(labels[type]);
    }
  }

  async function endGame() {
    if (!window.confirm('End the auction and show final results?')) return;
    action('auction:end');
  }

  const controls = [
    status === 'auction' && {
      type: 'auction:pause', label: '⏸ Pause', color: 'border-yellow-500/40 text-yellow-400'
    },
    status === 'paused' && {
      type: 'auction:resume', label: '▶️ Resume', color: 'border-green-500/40 text-green-400'
    },
    {
      type: 'auction:skip', label: '⏭ Skip Player',
      color: 'border-blue-500/30 text-blue-400',
      disabled: !roomState.currentPlayer
    },
  ].filter(Boolean) as { type: string; label: string; color: string; disabled?: boolean }[];

  return (
    <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-4 py-3 tap-target">
        <span className="text-orange-400 text-xs font-black uppercase tracking-wider">
          🎙️ Host Controls
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-500 text-xs">▼</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {controls.map(c => (
                  <motion.button key={c.type}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
                    onClick={() => action(c.type)}
                    disabled={loading === c.type || c.disabled}
                    className={`btn-secondary text-sm py-2.5 tap-target ${c.color} ${
                      (loading === c.type || c.disabled) ? 'opacity-40' : ''}`}>
                    {loading === c.type ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        Wait…
                      </span>
                    ) : c.label}
                  </motion.button>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: .97 }}
                onClick={endGame}
                disabled={loading === 'auction:end'}
                className="btn-secondary w-full py-3 text-sm border-red-500/40 text-red-400 tap-target">
                {loading === 'auction:end' ? '⏳ Ending…' : '🏁 End Auction & Show Results'}
              </motion.button>

              <p className="text-gray-600 text-xs text-center">
                {roomState.participants.length} team{roomState.participants.length !== 1 ? 's' : ''} · {' '}
                {(roomState.soldPlayers ?? []).length} sold · {roomState.unsoldCount ?? 0} unsold
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
