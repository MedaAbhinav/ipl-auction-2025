import React, { useEffect, useState, useRef } from 'react';
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

type TabType = 'auction' | 'chat';

// ── Lightning bid-war indicator ───────────────────────────────────────────────
function BidWarIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center justify-center gap-1 py-1"
    >
      {['⚡','🔥','⚡'].map((icon, i) => (
        <motion.span
          key={i}
          className="text-stadium-gold text-lg"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.4, delay: i * 0.12, repeat: Infinity }}
          style={{ filter: 'drop-shadow(0 0 6px #f9cd05)' }}
        >
          {icon}
        </motion.span>
      ))}
      <span className="text-stadium-gold text-xs font-bold tracking-wider">BID WAR!</span>
      {['⚡','🔥','⚡'].map((icon, i) => (
        <motion.span
          key={`r${i}`}
          className="text-stadium-gold text-lg"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.4, delay: (2 - i) * 0.12, repeat: Infinity }}
          style={{ filter: 'drop-shadow(0 0 6px #f9cd05)' }}
        >
          {icon}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default function AuctionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { emit } = useSocket();
  const { roomState, isHost, myTeamId, iplTeams, setRoomState } = useStore();
  const [tab, setTab] = useState<TabType>('auction');

  // Track rapid bid changes for bid-war indicator
  const bidWarRef = useRef(false);
  const bidWarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bidWarActive, setBidWarActive] = useState(false);
  const lastBidRef = useRef(0);
  const bidCountRef = useRef(0);

  useEffect(() => {
    if (!roomState && code) {
      emit('room:get_state', { roomCode: code }).then(res => {
        if (res?.success) setRoomState(res.state);
      });
    }
  }, [code]);

  useEffect(() => {
    if (roomState?.status === 'ended') navigate(`/results/${code}`);
    if (roomState?.status === 'lobby') navigate(`/lobby/${code}`);
  }, [roomState?.status]);

  // Detect bid war (3+ bids in 6 seconds)
  useEffect(() => {
    const bid = roomState?.currentBid ?? 0;
    if (bid > lastBidRef.current) {
      lastBidRef.current = bid;
      bidCountRef.current++;

      if (bidWarTimerRef.current) clearTimeout(bidWarTimerRef.current);
      bidWarTimerRef.current = setTimeout(() => {
        bidCountRef.current = 0;
        setBidWarActive(false);
      }, 6000);

      if (bidCountRef.current >= 3) {
        setBidWarActive(true);
      }
    }
  }, [roomState?.currentBid]);

  const { currentPlayer, auctionRecord, soldPlayers, unsoldCount, remainingPlayers, status } = roomState || {};
  const recordTeam = auctionRecord?.teamId ? iplTeams.find(t => t.id === auctionRecord.teamId) : null;

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'auction', label: 'Auction', icon: '🔨' },
    { key: 'chat',    label: 'Chat',    icon: '💬' }
  ];

  return (
    <>
      <SoldOverlay />
      <UnsoldOverlay />
      <RecordOverlay />

      {/* Paused overlay */}
      <AnimatePresence>
        {status === 'paused' && (
          <motion.div
            className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="paused-overlay absolute inset-0" />
            <motion.div
              className="relative paused-float z-10 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-stadium-card/90 border-2 border-yellow-500/50 rounded-2xl px-8 py-5"
                   style={{ boxShadow: '0 0 40px rgba(234,179,8,0.3)' }}>
                <div className="text-5xl mb-2">⏸</div>
                <p className="text-yellow-400 font-black text-xl tracking-wider">AUCTION PAUSED</p>
                <p className="text-gray-500 text-sm mt-1">Waiting for host to resume…</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col max-w-2xl mx-auto stadium-bg">

        {/* ── Header ── */}
        <div className="sticky top-0 z-30 bg-stadium-dark/95 backdrop-blur-md border-b border-stadium-border px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-stadium-gold font-black text-sm tracking-widest">IPL AUCTION</span>
              <span className={`badge text-xs border ${
                status === 'auction' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                status === 'paused'  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                'bg-gray-500/20 text-gray-300 border-gray-500/30'
              }`}>
                {status === 'auction' ? '🔴 LIVE' : status === 'paused' ? '⏸ PAUSED' : (status?.toUpperCase() ?? '—')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>🎯 {remainingPlayers ?? 0} left</span>
              <span>✅ {soldPlayers?.length ?? 0} sold</span>
              <span>❌ {unsoldCount ?? 0} unsold</span>
            </div>
          </div>

          {/* Record banner */}
          {auctionRecord && auctionRecord.price > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-1.5 p-1.5 rounded-lg border border-stadium-gold/30"
              style={{ background: 'rgba(249,205,5,0.07)' }}
            >
              <span className="text-xs text-stadium-gold">🏆 Record:</span>
              <span className="text-xs text-white font-bold">{auctionRecord.player?.name}</span>
              <span className="text-xs text-stadium-gold font-black">{fmt(auctionRecord.price)}</span>
              {recordTeam && <TeamLogo teamId={recordTeam.id} size="xs" />}
            </motion.div>
          )}

          {/* Bid war indicator */}
          <AnimatePresence>
            {bidWarActive && <BidWarIndicator active={bidWarActive} />}
          </AnimatePresence>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex border-b border-stadium-border bg-stadium-card/50">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 relative ${
                tab === t.key ? 'text-stadium-gold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon} {t.label}
              {tab === t.key && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-stadium-gold"
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          <AnimatePresence mode="wait">
            {tab === 'auction' && (
              <motion.div
                key="auction"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16,1,0.3,1] } }}
                exit={{ opacity: 0, x: 16 }}
                className="space-y-4"
              >
                {/* Current player with cinematic reveal */}
                <AnimatePresence mode="wait">
                  {currentPlayer ? (
                    <motion.div
                      key={currentPlayer.auctionId}
                      initial={{ opacity: 0, scale: 0.85, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0,
                                 transition: { duration: 0.6, ease: [0.16,1,0.3,1] } }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    >
                      <PlayerCard player={currentPlayer} large />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="card text-center py-10"
                    >
                      {status === 'paused' ? (
                        <>
                          <div className="text-5xl mb-3">⏸</div>
                          <p className="text-gray-400 font-semibold">Auction is paused</p>
                        </>
                      ) : (
                        <>
                          <div className="text-5xl mb-3 animate-spin-slow">⏳</div>
                          <p className="text-gray-400">Loading next player…</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bid panel */}
                <BidPanel />

                {/* AI Assistant */}
                <AIAssistant />

                {/* Teams bar */}
                <TeamsBar />

                {/* Host controls */}
                <HostControls />

                {/* Recently sold */}
                {(soldPlayers?.length ?? 0) > 0 && (
                  <div className="card">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">
                      Recently Sold
                    </p>
                    <div className="space-y-1.5">
                      {[...(soldPlayers ?? [])].reverse().slice(0, 5).map((p, i) => {
                        const t = iplTeams.find(x => x.id === p.soldTo);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                            className="flex items-center gap-2 text-xs py-1.5 border-b border-stadium-border/30"
                          >
                            <span className="text-white font-semibold flex-1 truncate">{p.name}</span>
                            <span className="text-gray-500">{p.role?.slice(0,3)}</span>
                            {p.soldTo && <TeamLogo teamId={p.soldTo} size="xs" />}
                            <span className="text-stadium-gold font-bold">{fmt(p.soldPrice ?? 0)}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
                exit={{ opacity: 0, x: -16 }}
              >
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
