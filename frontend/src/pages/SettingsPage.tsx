import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { setSoundEnabled as setSoundLib, setVolume as setVolumeLib } from '../lib/sounds';
import type { QualityMode } from '../types';

export default function SettingsPage() {
  const { qualityMode, setQualityMode, soundEnabled, setSoundEnabled, volume, setVolume } = useStore();

  function handleSoundToggle(val: boolean) {
    setSoundEnabled(val);
    setSoundLib(val);
  }

  function handleVolume(v: number) {
    setVolume(v);
    setVolumeLib(v);
  }

  const qualityOptions: { key: QualityMode; label: string; desc: string; icon: string }[] = [
    { key: 'high', label: 'High Quality', desc: 'Full fireworks, all animations, all effects', icon: '🔥' },
    { key: 'balanced', label: 'Balanced', desc: 'Smooth experience, reduced particles', icon: '⚖️' },
    { key: 'battery', label: 'Battery Saver', desc: 'Minimal animations, fastest loading', icon: '🔋' }
  ];

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white mb-6">⚙️ Settings</h1>

        {/* Quality mode */}
        <div className="card mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Display Quality</p>
          <div className="space-y-2">
            {qualityOptions.map(q => (
              <button
                key={q.key}
                onClick={() => setQualityMode(q.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  qualityMode === q.key
                    ? 'border-stadium-gold bg-stadium-gold/10'
                    : 'border-stadium-border bg-stadium-dark/40 hover:border-gray-500'
                }`}
              >
                <span className="text-2xl">{q.icon}</span>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${qualityMode === q.key ? 'text-stadium-gold' : 'text-white'}`}>
                    {q.label}
                  </p>
                  <p className="text-xs text-gray-500">{q.desc}</p>
                </div>
                {qualityMode === q.key && <span className="ml-auto text-stadium-gold">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Sound settings */}
        <div className="card mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Sound</p>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-semibold text-sm">Sound Effects</p>
              <p className="text-gray-500 text-xs">Bids, sold, unsold, timer sounds</p>
            </div>
            <button
              onClick={() => handleSoundToggle(!soundEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? 'bg-stadium-gold' : 'bg-stadium-border'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {soundEnabled && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-semibold">Volume</p>
                <span className="text-stadium-gold text-sm font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={volume}
                onChange={e => handleVolume(Number(e.target.value))}
                className="w-full accent-stadium-gold"
              />
            </div>
          )}
        </div>

        {/* About */}
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">About</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>🏏 IPL 2025 Auction Game</p>
            <p>📱 Works on all mobile browsers</p>
            <p>🌐 Real-time multiplayer via WebSocket</p>
            <p>🤖 AI-powered team rankings</p>
            <p className="text-gray-600 text-xs mt-3">
              Unofficial fan game. Player data sourced from public IPL records.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
