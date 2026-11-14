import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useSocket } from '../../hooks/useSocket';
import TeamLogo from '../ui/TeamLogo';

const EMOJIS = ['🔥', '😭', '😂', '👏', '❤️', '😎', '😱', '🏏', '👑', '💰'];

export default function LiveChat() {
  const { chatMessages, myName, myTeamId, roomState, iplTeams } = useStore();
  const { emit } = useSocket();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function send(message?: string, emoji?: string) {
    if (!roomState?.roomCode) return;
    if (!message && !emoji) return;
    emit('chat:message', {
      roomCode: roomState.roomCode,
      name: myName,
      teamId: myTeamId || '',
      message,
      emoji
    });
    setText('');
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) send(text.trim());
    }
  }

  const unread = chatMessages.length;

  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          💬 Live Chat
        </span>
        <span className="text-xs text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Messages */}
          <div className="h-40 overflow-y-auto space-y-1.5 pr-1">
            {chatMessages.length === 0 && (
              <p className="text-gray-600 text-xs text-center py-4">No messages yet. Say hello!</p>
            )}
            {chatMessages.map(m => {
              const ipl = iplTeams.find(t => t.id === m.teamId);
              const isMe = m.name === myName && m.teamId === myTeamId;
              return (
                <div key={m.id} className={`flex gap-2 items-start ${isMe ? 'flex-row-reverse' : ''}`}>
                  {m.teamId && <TeamLogo teamId={m.teamId} size="xs" className="flex-shrink-0 mt-0.5" />}
                  <div className={`max-w-[75%] rounded-xl px-2.5 py-1.5 text-xs ${
                    isMe ? 'bg-blue-600/30 text-blue-100' : 'bg-stadium-dark text-gray-200'
                  }`}>
                    {!isMe && (
                      <p className="font-bold text-xs mb-0.5" style={{ color: ipl?.primaryColor ?? '#aaa' }}>
                        {m.name}
                      </p>
                    )}
                    {m.emoji && <span className="text-xl">{m.emoji}</span>}
                    {m.message && <span>{m.message}</span>}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Emoji reactions */}
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => send(undefined, e)}
                className="text-xl hover:scale-125 transition-transform active:scale-110"
              >
                {e}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              maxLength={150}
              className="input-field text-sm py-2 flex-1"
            />
            <button
              onClick={() => text.trim() && send(text.trim())}
              className="btn-primary py-2 px-4 text-sm"
              disabled={!text.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
