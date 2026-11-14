import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';
import TeamLogo from '../ui/TeamLogo';
import CountdownTimer from '../ui/CountdownTimer';

function fmt(n: number) {
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n}L`;
}

/* Slot-machine flip digit */
function FlipNumber({ value }: { value: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span key={value}
        initial={{ y: -30, opacity: 0, rotateX: 90 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        exit={{ y: 30, opacity: 0, rotateX: -90 }}
        transition={{ duration: .22, ease: [.22,.61,.36,1] }}
        style={{ display: 'inline-block', perspective: '400px' }}>
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

function AnimBid({ value }: { value: number }) {
  const str = fmt(value);
  return (
    <span className="inline-flex items-baseline">
      {str.split('').map((ch, i) => <FlipNumber key={`${i}-${ch}`} value={ch} />)}
    </span>
  );
}

const QUICK_INCS = [
  { label: '+₹25L',  val: 25 },
  { label: '+₹50L',  val: 50 },
  { label: '+₹1Cr',  val: 100 },
  { label: '+₹2Cr',  val: 200 },
];

export default function BidPanel() {
  const { roomState, myTeamId, iplTeams } = useStore();
  const { emit } = useSocket();
  const [bidding, setBidding] = useState(false);
  const [bidWar, setBidWar] = useState(false);
  const prevBidRef = useRef(0);

  const { currentPlayer, currentBid, currentBidder, status, settings, bidHistory } = roomState ?? {};

  // Detect bid war (rapid successive bids)
  useEffect(() => {
    if (!currentBid || currentBid === prevBidRef.current) return;
    const diff = currentBid - prevBidRef.current;
    if (prevBidRef.current > 0 && diff <= (settings?.bidIncrement ?? 25) * 2) {
      setBidWar(true);
      setTimeout(() => setBidWar(false), 2000);
    }
    prevBidRef.current = currentBid;
  }, [currentBid]);

  if (!roomState) return null;

  const isActive   = status === 'auction';
  const myTeam     = roomState.teams[myTeamId ?? ''];
  const iAmHighest = currentBidder === myTeamId;
  const topTeam    = currentBidder ? iplTeams.find(t => t.id === currentBidder) : null;

  const minBid = !currentBid
    ? (currentPlayer?.basePrice ?? 0)
    : currentBid + (settings?.bidIncrement ?? 25);

  const canBid = isActive && !!currentPlayer && !!myTeamId && !iAmHighest
    && myTeam && myTeam.purse >= minBid
    && myTeam.squadSize < (settings?.maxSquadSize ?? 18)
    && (!currentPlayer?.isOverseas || (myTeam?.overseas ?? 0) < (settings?.maxOverseas ?? 8));

  async function placeBid(amount: number) {
    if (!myTeamId || !roomState?.roomCode || bidding) return;
    setBidding(true);
    const res = await emit('bid:place', { roomCode: roomState.roomCode, teamId: myTeamId, amount });
    setBidding(false);
    if (!res?.success) toast.error(res?.error || 'Bid failed');
  }

  const blockReason = !myTeamId ? 'No team selected' :
    myTeam && myTeam.purse < minBid ? `Need ${fmt(minBid)} — only ${fmt(myTeam.purse)} left` :
    myTeam && myTeam.squadSize >= (settings?.maxSquadSize ?? 18) ? 'Squad full (18/18)' :
    currentPlayer?.isOverseas && (myTeam?.overseas ?? 0) >= (settings?.maxOverseas ?? 8) ? 'Overseas limit reached (8/8)' : null;

  return (
    <div className="card card-glow space-y-4">
      
      {/* Bid war lightning banner */}
      <AnimatePresence>
        {bidWar && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/40">
            <span className="bid-war-lightning text-xl">⚡</span>
            <span className="text-yellow-400 font-bold text-sm">BIDDING WAR!</span>
            <span className="bid-war-lightning text-xl">⚡</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current bid + timer row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Current Bid</p>
          <div className="text-3xl font-black text-gradient-gold">
            <AnimBid value={currentBid && currentBid > 0 ? currentBid : (currentPlayer?.basePrice ?? 0)} />
          </div>
          {topTeam && (
            <motion.div key={topTeam.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              className="flex items-center gap-1.5 mt-1">
              <TeamLogo teamId={topTeam.id} size="xs" />
              <span className="text-xs font-bold" style={{ color: topTeam.primaryColor }}>
                {iAmHighest ? '✅ You are leading!' : topTeam.name}
              </span>
            </motion.div>
          )}
        </div>
        <CountdownTimer totalSeconds={settings?.timerSeconds ?? 25} />
      </div>

      {/* Quick bid buttons */}
      {isActive && currentPlayer && myTeamId && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_INCS.map(({ label, val }) => {
              const amount = (currentBid ?? 0) + val;
              const disabled = !canBid || (myTeam?.purse ?? 0) < amount || bidding;
              return (
                <motion.button key={val} onClick={() => placeBid(amount)} disabled={disabled}
                  whileHover={!disabled ? { scale:1.04, y:-1 } : {}}
                  whileTap={!disabled ? { scale:.95 } : {}}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all tap-target ${
                    disabled ? 'opacity-30 border-stadium-border text-gray-600 cursor-not-allowed' :
                    'border-stadium-gold/40 text-stadium-gold bg-stadium-gold/8 hover:bg-stadium-gold/15'}`}>
                  {label}
                </motion.button>
              );
            })}
          </div>

          {/* Main BID button */}
          <motion.button onClick={() => placeBid(minBid)} disabled={!canBid || bidding}
            whileHover={canBid ? { scale:1.02, y:-2 } : {}}
            whileTap={canBid ? { scale:.97 } : {}}
            animate={canBid && !iAmHighest ? { boxShadow: ['0 0 20px rgba(249,205,5,.3)','0 0 50px rgba(249,205,5,.6)','0 0 20px rgba(249,205,5,.3)'] } : {}}
            transition={{ duration:1.5, repeat:Infinity }}
            className={`w-full py-5 rounded-2xl font-black text-xl tap-target transition-all ${
              iAmHighest ? 'bg-green-500/20 border-2 border-green-500/60 text-green-400' :
              canBid     ? 'btn-primary' :
              'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'}`}>
            {bidding ? (
              <span className="animate-pulse flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                Placing bid…
              </span>
            ) : iAmHighest ? '✅ You\'re Winning!' :
              canBid ? `🔨 BID ${fmt(minBid)}` : '🚫 Cannot Bid'}
          </motion.button>

          {/* Purse info bar */}
          {myTeam && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label:'Purse Left', value: fmt(myTeam.purse), color:'#f9cd05' },
                { label:'Squad',      value: `${myTeam.squadSize}/${settings?.maxSquadSize??18}`, color:'#60a5fa' },
                { label:'Overseas',   value: `${myTeam.overseas}/${settings?.maxOverseas??8}`,    color:'#fb923c' }
              ].map(s => (
                <div key={s.label} className="bg-black/30 rounded-xl p-2 text-center">
                  <p className="font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-gray-600">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Block reason */}
          {blockReason && !iAmHighest && isActive && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="text-center text-xs text-red-400 bg-red-500/10 rounded-xl py-2 px-3">
              ⚠️ {blockReason}
            </motion.p>
          )}
        </>
      )}

      {/* Paused */}
      {status === 'paused' && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">⏸</div>
          <p className="text-yellow-400 font-bold">Auction Paused</p>
          <p className="text-gray-500 text-xs mt-1">Waiting for host to resume…</p>
        </div>
      )}

      {/* Live bid feed */}
      {(bidHistory?.length ?? 0) > 0 && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Live Bids</p>
          {[...(bidHistory ?? [])].reverse().slice(0, 8).map((b, i) => {
            const t = iplTeams.find(x => x.id === b.teamId);
            return (
              <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * .03 }}
                className="flex items-center justify-between py-1 border-b border-white/5 text-xs">
                <div className="flex items-center gap-1.5">
                  {t && <TeamLogo teamId={b.teamId} size="xs" />}
                  <span style={{ color: t?.primaryColor ?? '#aaa' }}>{b.teamName}</span>
                </div>
                <span className="text-stadium-gold font-bold">{fmt(b.amount)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
