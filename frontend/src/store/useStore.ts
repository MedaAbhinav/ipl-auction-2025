import { create } from 'zustand';
import type { RoomState, IPLTeam, Player, TeamRanking, PlayingXI, ChatMessage, QualityMode } from '../types';

interface AuctionStore {
  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Identity
  myName: string;
  myTeamId: string | null;
  isHost: boolean;
  roomCode: string | null;
  setIdentity: (name: string, teamId: string | null, isHost: boolean, code: string) => void;

  // Room state (from server)
  roomState: RoomState | null;
  setRoomState: (s: RoomState) => void;

  // IPL teams master list
  iplTeams: IPLTeam[];
  setIplTeams: (t: IPLTeam[]) => void;

  // My squad (full player objects)
  mySquad: Player[];
  setMySquad: (p: Player[]) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;

  // End game
  rankings: TeamRanking[];
  playingXIs: Record<string, PlayingXI>;
  awards: Record<string, any>;
  setEndGameData: (r: TeamRanking[], xi: Record<string, PlayingXI>, a: Record<string, any>) => void;

  // UI
  qualityMode: QualityMode;
  setQualityMode: (m: QualityMode) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;

  // Watchlist
  watchlist: Set<number>;
  toggleWatchlist: (auctionId: number) => void;

  // Overlay flags
  showSoldOverlay: boolean;
  soldOverlayData: { player: Player; teamId: string; soldPrice: number; isRecord: boolean } | null;
  showSoldOverlayFn: (d: AuctionStore['soldOverlayData']) => void;
  hideSoldOverlay: () => void;

  showUnsoldOverlay: boolean;
  unsoldPlayer: Player | null;
  showUnsoldOverlayFn: (p: Player) => void;
  hideUnsoldOverlay: () => void;

  showRecordOverlay: boolean;
  recordData: { player: Player; teamId: string; soldPrice: number; prevRecord: number } | null;
  showRecordOverlayFn: (d: AuctionStore['recordData']) => void;
  hideRecordOverlay: () => void;

  reset: () => void;
}

export const useStore = create<AuctionStore>((set) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  myName: '',
  myTeamId: null,
  isHost: false,
  roomCode: null,
  setIdentity: (name, teamId, isHost, code) =>
    set({ myName: name, myTeamId: teamId, isHost, roomCode: code }),

  roomState: null,
  setRoomState: (s) => set({ roomState: s }),

  iplTeams: [],
  setIplTeams: (t) => set({ iplTeams: t }),

  mySquad: [],
  setMySquad: (p) => set({ mySquad: p }),

  chatMessages: [],
  addChatMessage: (m) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-99), m] })),

  rankings: [],
  playingXIs: {},
  awards: {},
  setEndGameData: (r, xi, a) => set({ rankings: r, playingXIs: xi, awards: a }),

  qualityMode: 'balanced',
  setQualityMode: (m) => set({ qualityMode: m }),

  soundEnabled: true,
  setSoundEnabled: (v) => set({ soundEnabled: v }),

  volume: 0.6,
  setVolume: (v) => set({ volume: v }),

  watchlist: new Set(),
  toggleWatchlist: (auctionId) =>
    set((s) => {
      const next = new Set(s.watchlist);
      next.has(auctionId) ? next.delete(auctionId) : next.add(auctionId);
      return { watchlist: next };
    }),

  showSoldOverlay: false,
  soldOverlayData: null,
  showSoldOverlayFn: (d) => set({ showSoldOverlay: true, soldOverlayData: d }),
  hideSoldOverlay: () => set({ showSoldOverlay: false }),

  showUnsoldOverlay: false,
  unsoldPlayer: null,
  showUnsoldOverlayFn: (p) => set({ showUnsoldOverlay: true, unsoldPlayer: p }),
  hideUnsoldOverlay: () => set({ showUnsoldOverlay: false }),

  showRecordOverlay: false,
  recordData: null,
  showRecordOverlayFn: (d) => set({ showRecordOverlay: true, recordData: d }),
  hideRecordOverlay: () => set({ showRecordOverlay: false }),

  reset: () => set({
    myName: '', myTeamId: null, isHost: false, roomCode: null,
    roomState: null, mySquad: [], chatMessages: [],
    rankings: [], playingXIs: {}, awards: {},
    showSoldOverlay: false, soldOverlayData: null,
    showUnsoldOverlay: false, unsoldPlayer: null,
    showRecordOverlay: false, recordData: null
  })
}));
