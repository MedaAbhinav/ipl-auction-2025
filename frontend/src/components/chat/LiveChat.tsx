import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';
import TeamLogo from '../ui/TeamLogo';

const EMOJIS = ['🔥','😭','😂','👏','❤️','😎','😱','🏏','👑','💰','🎉','⚡'];

export default function LiveChat() {
  const { chatMessages, myName, myTeamId, roomState, iplTeams } = useStore();
  const { emit } = useSocket();
  const [text, setText]   = useState('');
  const [open, setOpen]   = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, open]);

  function send(message?: string, emoji?: string) {
    if (!roomState?.roomCode || (!message && !emoji)) return;
    emit('chat:message', {
      roomCode: roomState.roomCode,
      name: myName, teamId: myTeamId || '',
      message, emoji
    });
    setText('');
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) send(text.trim()); }
  }

  return (
    <div className="card card-glow flex flex-col" style={{ minHeight: '300px' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between tap-target">
        <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          💬 Live Chat
          {chatMessages.length > 0 && (
            <span className="badge bg-stadium-gold/20 text-stadium-gold border-stadium-gold/30 text-xs">
              {chatMessages.length}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-500 text-xs">▼</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 flex flex-col gap-3">

            {/* Messages */}
            <div className="flex-1 h-44 overflow-y-auto space-y-1.5 pr-1">
              {chatMessages.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-6">
                  No messages yet. Be the first! 👋
                </p>
              )}
              <AnimatePresence>
                {chatMessages.map(m => {
                  const ipl  = iplTeams.find(t => t.id === m.teamId);
                  const isMe = m.name === myName && m.teamId === myTeamId;
                  return (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, y: 8, scale: .95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                      {m.teamId && !isMe && <TeamLogo teamId={m.teamId} size="xs" className="flex-shrink-0 mb-0.5" />}
                      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs ${
                        isMe
                          ? 'bg-blue-600/30 text-blue-100 rounded-br-sm'
                          : 'bg-white/5 text-gray-200 rounded-bl-sm'}`}>
                        {!isMe && (
                          <p className="font-bold text-xs mb-0.5" style={{ color: ipl?.primaryColor ?? '#aaa' }}>
                            {m.name}
                          </p>
                        )}
                        <div className="flex items-center gap-1">
                          {m.emoji   && <span className="text-xl leading-none">{m.emoji}</span>}
                          {m.message && <span>{m.message}</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Emoji reactions */}
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <motion.button key={e} onClick={() => send(undefined, e)}
                  whileHover={{ scale: 1.3 }} whileTap={{ scale: .9 }}
                  className="text-xl tap-target leading-none">
                  {e}
                </motion.button>
              ))}
            </div>

            {/* Text input */}
            <div className="flex gap-2">
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
                placeholder="Say something…" maxLength={150} className="input-field text-sm py-2.5 flex-1" />
              <motion.button onClick={() => text.trim() && send(text.trim())} disabled={!text.trim()}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: .95 }}
                className="btn-primary py-2.5 px-4 text-sm tap-target disabled:opacity-30">
                Send
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
