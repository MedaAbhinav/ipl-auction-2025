export interface IPLTeam {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logo: string;
  homeGround: string;
}

export interface PlayerStats {
  matches: number;
  runs: number;
  avg: number;
  sr: number;
  wickets: number;
}

export interface Player {
  id: number;
  auctionId: number;
  name: string;
  nationality: string;
  isOverseas: boolean;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
  battingStyle: string;
  bowlingStyle: string;
  franchise: string;
  basePrice: number;
  photo: string;
  stats: PlayerStats;
  experience: 'Legend' | 'Senior' | 'Mid-career' | 'Young';
  soldPrice?: number;
  soldTo?: string;
}

export interface Participant {
  name: string;
  teamId: string;
  teamName?: string;
  teamLogo?: string;
  connected: boolean;
}

export interface TeamState {
  purse: number;
  squadSize: number;
  overseas: number;
  indian: number;
}

export interface BidHistoryItem {
  teamId: string;
  amount: number;
  ts: number;
  teamName: string;
}

export interface AuctionRecord {
  price: number;
  player: Player | null;
  teamId: string | null;
}

export interface RoomState {
  roomCode: string;
  status: 'lobby' | 'auction' | 'paused' | 'unsold_round' | 'ended';
  hostName: string;
  settings: AuctionSettings;
  participants: Participant[];
  teams: Record<string, TeamState>;
  currentPlayer: Player | null;
  currentBid: number;
  currentBidder: string | null;
  bidHistory: BidHistoryItem[];
  soldPlayers: Player[];
  unsoldCount: number;
  auctionRecord: AuctionRecord;
  timerEndsAt: number | null;
  remainingPlayers: number;
}

export interface AuctionSettings {
  initialPurse: number;
  maxSquadSize: number;
  maxOverseas: number;
  bidIncrement: number;
  timerSeconds: number;
  maxParticipants: number;
  allowUnsoldRound: boolean;
  soundEnabled: boolean;
}

export interface TeamRanking {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  breakdown: Record<string, number>;
  squadSize: number;
  totalSpent: number;
  remaining: number;
  overseas: number;
  indian: number;
  strengths: string[];
  weaknesses: string[];
  bestPurchases: { name: string; role: string; soldPrice: number }[];
  squadPenalty: number;
}

export interface PlayingXI {
  xi: Player[];
  captain: Player;
  viceCaptain: Player;
  impactSub: Player | null;
}

export interface ChatMessage {
  id: number;
  name: string;
  teamId: string;
  message?: string;
  emoji?: string;
  ts: number;
}

export type QualityMode = 'high' | 'balanced' | 'battery';
