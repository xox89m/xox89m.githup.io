export type AppTheme = 'light' | 'dark';

export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas';

export interface PeriodicElement {
  symbol: string;
  nameTH: string;
  nameEN?: string;
  atomicNumber: number;
  group: number;
  period: number;
  category: ElementCategory;
  hint: string;
  trivia: string;
  atomicMass?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  totalPoints: number;
  level: number;
  gamesPlayed: number;
  wins: number;
  highestCombo: number;
  isGuest?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  level: number;
  wins: number;
  rank?: number;
}

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  elementSymbol?: string;
}

export interface BattlePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  currentQuestionIndex: number;
  isReady: boolean;
  finished: boolean;
  combo: number;
}

export interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  totalPoints: number;
  level: number;
  status: string; // e.g., 'online', 'playing_quiz', 'playing_battle', 'placing_grid'
  lastActive: number;
  isGuest?: boolean;
}

export interface LiveScoreEvent {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  pointsAdded: number;
  gameMode: string;
  totalPoints: number;
  timestamp: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'symbol' | 'name' | 'atomicNumber' | 'groupPeriod' | 'trivia' | 'category';
  options: string[];
  correctIndex: number;
  explanation: string;
  elementSymbol: string;
  elementName: string;
  atomicNumber: number;
  category: ElementCategory;
}

export interface BattleRoomState {
  roomId: string;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  players: Record<string, BattlePlayer>;
  questions: BattleQuestion[];
  startTime?: number;
  winnerId?: string | null;
}
