import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import PlayerCard from '../components/auction/PlayerCard';
import BidPanel from '../components/auction/BidPanel';
import TeamsBar from '../components/auction/TeamsBar';
import HostControls from '../components/auction/HostControls';
import LiveChat from '../components/chat/LiveChat';
import SoldOverlay from '../components/overlays/SoldOverlay';
import UnsoldOverlay from '../components/overlays/UnsoldOverlay';
import RecordOverlay from '../components/overlays/RecordOverlay';
import TeamLogo from '../components/ui/TeamLogo';
import NavBar from '../components/ui/NavBar';
import AIAssistant from '../components/auction/AIAssistant';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

type TabType = 'auction' | 'teams' | 'chat';

export default function AuctionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { emit } = useSocket();
  const { roomState, isHost, myTeamId, iplTeams, setRoomState } = useStore();
  const [tab, setTab] = useState<TabType>('auction');
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    if (!roomState && code) {
      emit('room:get_state', { roomCode: code }).then(res => {
        if (res?.success) setRoomState(res.state);
      });
    }
  }, [code]);

  // bump key to re-trigger player reveal animation on each new player
  useEffect(() => {
    if (roomState?.currentPlayer) setPlayerKey(k => k + 1);
  }, [roomState?.currentPlayer?.id]);

  useEffect(() => {
    if (roomState?.status === 'ended') navigate(`/results/${code}`);
    if (roomState?.status === 'lobby') navigate(`/lobby/${code}`);
  }, [roomState?.status]);

  const { currentPlayer, auctionRecord, soldPlayers, unsoldCount, remainingPlayers, status, settings } = roomState || {};
  const recordTeam = auctionRecord?.teamId ? iplTeams.find(t => t.id === auctionRecord.teamId) : null;

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'auction', label: 'Auction', icon: '🔨' },
    { key: 'teams',   label: 'Teams',   icon: '🏏' },
    { key: 'chat',    label: 'Chat',    icon: '💬' },
  ];

  return (
    <>
      <SoldOverlay />
      <UnsoldOverlay />
      <RecordOverlay />

      <div className="min-h-screen flex flex-col max-w-2xl mx-auto pb-24"
           style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 0%, #150a2a 0%, #07071a 60%)' }}>

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-30 glass border-b border-white/5 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-stadium-gold font-black text-sm hidden sm:block">🏏 IPL AUCTION</span>
              <span className={`badge text-xs flex-shrink-0 ${
                status === 'auction'  ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                status === 'paused'   ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                {status === 'auction' ? '🔴 LIVE' : status === 'paused' ? '⏸ PAUSED' : (status ?? '').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
              <span>🎯 <strong className="text-white">{remainingPlayers ?? 0}</strong> left</span>
              <span>✅ <strong className="text-green-400">{soldPlayers?.length ?? 0}</strong></span>
              <span>❌ <strong className="text-red-400">{unsoldCount ?? 0}</strong></span>
            </div>
          </div>

          {/* Auction record mini-banner */}
          <AnimatePresence>
            {auctionRecord && auctionRecord.price > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-xl bg-stadium-gold/10 border border-stadium-gold/20">
                <span className="text-xs text-stadium-gold">🏆 Record:</span>
                <span className="text-xs text-white font-bold truncate">{auctionRecord.player?.name}</span>
                <span className="text-xs text-stadium-gold font-black ml-auto flex-shrink-0">{fmt(auctionRecord.price)}</span>
                {recordTeam && <TeamLogo teamId={recordTeam.id} size="xs" className="flex-shrink-0" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-white/5 bg-black/20 flex-shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors tap-target ${
                tab === t.key ? 'text-stadium-gold border-b-2 border-stadium-gold' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">

            {/* AUCTION TAB */}
            {tab === 'auction' && (
              <motion.div key="auction"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: .25 }}
                className="space-y-4">

                {/* Current player spotlight */}
                {currentPlayer ? (
                  <motion.div key={`player-${playerKey}`}
                    initial={{ opacity: 0, scale: .88, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
                    {/* Spotlight glow behind card */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                           style={{ boxShadow: '0 0 60px rgba(249,205,5,.12)', borderRadius: '20px' }} />
                      <PlayerCard player={currentPlayer} large />
                    </div>
                  </motion.div>
                ) : (
                  <div className="card text-center py-10">
                    {status === 'paused' ? (
                      <>
                        <motion.div className="text-5xl mb-3"
                          animate={{ opacity: [1, .4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>⏸</motion.div>
                        <p className="text-yellow-400 font-bold">Auction Paused</p>
                        <p className="text-gray-500 text-sm mt-1">Host will resume shortly…</p>
                      </>
                    ) : (
                      <>
                        <motion.div className="text-5xl mb-3"
                          animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>⏳</motion.div>
                        <p className="text-gray-400">Loading next player…</p>
                      </>
                    )}
                  </div>
                )}

                {/* Bid panel */}
                <BidPanel />

                {/* AI Assistant */}
                <AIAssistant />

                {/* Host controls */}
                <HostControls />

                {/* Recently sold */}
                <AnimatePresence>
                  {(soldPlayers?.length ?? 0) > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                      <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
                        ✅ Recently Sold
                      </p>
                      <div className="space-y-1.5">
                        {[...(soldPlayers ?? [])].reverse().slice(0, 6).map((p, i) => {
                          const t = iplTeams.find(x => x.id === p.soldTo);
                          return (
                            <motion.div key={`${p.auctionId}-${i}`}
                              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * .04 }}
                              className="flex items-center gap-2.5 py-1.5 border-b border-white/5">
                              <span className="text-white text-xs font-semibold flex-1 truncate">{p.name}</span>
                              <span className="text-gray-500 text-xs">{p.role?.slice(0, 3)}</span>
                              {p.soldTo && <TeamLogo teamId={p.soldTo} size="xs" />}
                              <span className="text-stadium-gold text-xs font-black">{fmt(p.soldPrice ?? 0)}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* TEAMS TAB */}
            {tab === 'teams' && (
              <motion.div key="teams"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: .25 }}>
                <TeamsBar />
              </motion.div>
            )}

            {/* CHAT TAB */}
            {tab === 'chat' && (
              <motion.div key="chat"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: .25 }}>
                <LiveChat />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NavBar code={code} />
      </div>
    </>
  );
}
