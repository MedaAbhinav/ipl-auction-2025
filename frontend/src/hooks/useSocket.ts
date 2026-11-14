import { useEffect, useCallback } from 'react';
import { getSocket, connectSocket } from '../lib/socket';
import { useStore } from '../store/useStore';
import { Sounds } from '../lib/sounds';
import type { RoomState, Player, ChatMessage } from '../types';

export function useSocket() {
  const {
    setConnected, setRoomState, addChatMessage,
    showSoldOverlayFn, hideSoldOverlay,
    showUnsoldOverlayFn, hideUnsoldOverlay,
    showRecordOverlayFn, hideRecordOverlay,
    setEndGameData, soundEnabled, roomState
  } = useStore();

  useEffect(() => {
    const socket = getSocket();
    connectSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:state', (state: RoomState) => {
      setRoomState(state);
    });

    socket.on('player:reveal', ({ player }: { player: Player }) => {
      if (soundEnabled) Sounds.reveal();
    });

    socket.on('bid:updated', () => {
      if (soundEnabled) Sounds.bid();
    });

    socket.on('player:sold', (data: {
      player: Player; teamId: string; soldPrice: number;
      isRecord: boolean; auctionRecord: any;
    }) => {
      if (soundEnabled) {
        if (data.isRecord) Sounds.record();
        else Sounds.sold();
      }

      if (data.isRecord) {
        showRecordOverlayFn({
          player: data.player,
          teamId: data.teamId,
          soldPrice: data.soldPrice,
          prevRecord: data.auctionRecord?.price ?? 0
        });
        setTimeout(() => hideRecordOverlay(), 5000);
      } else {
        showSoldOverlayFn({
          player: data.player,
          teamId: data.teamId,
          soldPrice: data.soldPrice,
          isRecord: false
        });
        setTimeout(() => hideSoldOverlay(), 4000);
      }
    });

    socket.on('player:unsold', ({ player }: { player: Player }) => {
      if (soundEnabled) Sounds.unsold();
      showUnsoldOverlayFn(player);
      setTimeout(() => hideUnsoldOverlay(), 3500);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      addChatMessage(msg);
    });

    socket.on('auction:ended', (data: { rankings: any[]; playingXIs: any; awards: any }) => {
      setEndGameData(data.rankings, data.playingXIs, data.awards);
      if (soundEnabled) Sounds.champion();
    });

    socket.on('timer:update', () => {});

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:state');
      socket.off('player:reveal');
      socket.off('bid:updated');
      socket.off('player:sold');
      socket.off('player:unsold');
      socket.off('chat:message');
      socket.off('auction:ended');
      socket.off('timer:update');
    };
  }, [soundEnabled]);

  const emit = useCallback((event: string, data?: any): Promise<any> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (data !== undefined) {
        socket.emit(event, data, (res: any) => resolve(res));
      } else {
        socket.emit(event, (res: any) => resolve(res));
      }
    });
  }, []);

  return { emit, socket: getSocket() };
}
