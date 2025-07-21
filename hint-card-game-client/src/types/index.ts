
export type Suit = 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'rainbow';

export interface Card {
  id: number;
  suit: Suit;
  rank: number;
  hintedSuit?: boolean;
  hintedRank?: boolean;
}

export interface Player {
  id: number;
  name: string;
  hand: Card[];
}

export interface GameState {
  gameId: string;
  players: Player[];
  deckSize: number;
  discardPile: Card[];
  playedCards: Record<Suit, number>;
  hintTokens: number;
  stormTokens: number;
  currentPlayerId: number | null;
  hasStarted: boolean;
  hostId: number;
  displayName: string;
  lastActivity: number;
  isGameOver: boolean;
  isGameWon: boolean;
  deckEmptyTurnsCounter: number;
  deckWasEmpty: boolean;
  gameEndReason: 'win' | 'storm' | 'deck_empty_turns' | null;
  score: number;
  lastAction: string | null;
}
