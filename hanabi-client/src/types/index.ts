
export type Suit = 'red' | 'green' | 'blue' | 'yellow' | 'white';

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
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  playedCards: Record<Suit, number>;
  hintTokens: number;
  stormTokens: number;
  currentPlayerId: number;
}
