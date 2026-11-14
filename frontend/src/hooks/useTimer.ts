import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { useStore } from '../store/useStore';
import { Sounds } from '../lib/sounds';

export function useTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const { soundEnabled } = useStore();

  useEffect(() => {
    const socket = getSocket();

    const onTimerUpdate = ({ endsAt }: { endsAt: number; seconds: number }) => {
      endsAtRef.current = endsAt;

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (!endsAtRef.current) return;
        const left = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
        setSecondsLeft(left);

        if (left <= 5 && left > 0 && soundEnabled) {
          Sounds.countdown();
        }

        if (left === 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, 250);
    };

    socket.on('timer:update', onTimerUpdate);
    return () => {
      socket.off('timer:update', onTimerUpdate);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [soundEnabled]);

  const isWarning = secondsLeft > 0 && secondsLeft <= 5;
  const progress = endsAtRef.current
    ? Math.min(100, ((endsAtRef.current - Date.now()) / (endsAtRef.current - (endsAtRef.current - 25000))) * 100)
    : 0;

  return { secondsLeft, isWarning };
}
