import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';

export default function HostControls() {
  const { roomState, isHost } = useStore();
  const { emit } = useSocket();
  const [loading, setLoading] = useState('');

  if (!isHost || !roomState) return null;

  const { status, roomCode } = roomState;
  const isRunning = status === 'auction';
  const isPaused = status === 'paused';

  async function action(type: string, payload?: any) {
    setLoading(type);
    const res = await emit(type, { roomCode, ...payload });
    setLoading('');
    if (!res?.success) toast.error(res?.error || 'Action failed');
    else {
      const labels: Record<string, string> = {
        'auction:pause': 'Paused', 'auction:resume': 'Resumed',
        'auction:skip': 'Player skipped', 'auction:end': 'Auction ended'
      };
      if (labels[type]) toast.success(labels[type]);
    }
  }

  async function endGame() {
    if (!confirm('End the auction and show final results?')) return;
    action('auction:end');
  }

  return (
    <div className="card border-orange-500/30 bg-orange-500/5">
      <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">🎙 Host Controls</p>
      <div className="grid grid-cols-2 gap-2">
        {isRunning && (
          <button
            onClick={() => action('auction:pause')}
            disabled={loading === 'auction:pause'}
            className="btn-secondary text-sm py-2 border-yellow-500/40 text-yellow-400"
          >
            ⏸ Pause
          </button>
        )}
        {isPaused && (
          <button
            onClick={() => action('auction:resume')}
            disabled={loading === 'auction:resume'}
            className="btn-secondary text-sm py-2 border-green-500/40 text-green-400"
          >
            ▶️ Resume
          </button>
        )}
        <button
          onClick={() => action('auction:skip')}
          disabled={loading === 'auction:skip' || !roomState.currentPlayer}
          className="btn-secondary text-sm py-2"
        >
          ⏭ Skip Player
        </button>
        <button
          onClick={endGame}
          disabled={loading === 'auction:end'}
          className="btn-secondary text-sm py-2 border-red-500/40 text-red-400 col-span-2"
        >
          🏁 End Auction & Show Results
        </button>
      </div>
    </div>
  );
}
