import React from 'react';
import { GameState, Player, Suit, Card } from '../types';
import PlayerHand from './PlayerHand';
import GameInfo from './GameInfo';
import Controls from './Controls';

const suits: Suit[] = ['red', 'green', 'blue', 'yellow', 'white'];
const ranks = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];

const initialDeck: Card[] = suits.flatMap((suit, suitIndex) => 
  ranks.map((rank, rankIndex) => ({
    id: suitIndex * 10 + rankIndex,
    suit,
    rank,
  }))
);

const initialGameState: GameState = {
  players: [
    {
      id: 1,
      name: 'プレイヤー1',
      hand: [
        { id: 1, suit: 'red', rank: 1 },
        { id: 2, suit: 'green', rank: 2 },
        { id: 3, suit: 'blue', rank: 3 },
      ],
    },
    {
      id: 2,
      name: 'プレイヤー2',
      hand: [
        { id: 4, suit: 'yellow', rank: 4 },
        { id: 5, suit: 'white', rank: 5 },
      ],
    },
  ],
  deck: initialDeck,
  discardPile: [],
  playedCards: { red: 0, green: 0, blue: 0, yellow: 0, white: 0 },
  hintTokens: 8,
  stormTokens: 3,
  currentPlayerId: 1,
};

const Board: React.FC = () => {
  const [gameState, setGameState] = React.useState<GameState>(initialGameState);
  const [selectedCardId, setSelectedCardId] = React.useState<number | null>(null);

  const handleSelectCard = (cardId: number) => {
    setSelectedCardId(cardId);
  };

  const handlePlayCard = () => {
    if (selectedCardId === null) return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer) return;

    const cardToPlay = currentPlayer.hand.find(c => c.id === selectedCardId);
    if (!cardToPlay) return;

    const newGameState = { ...gameState };
    const newPlayer = { ...currentPlayer };

    // Play card logic
    if (newGameState.playedCards[cardToPlay.suit] === cardToPlay.rank - 1) {
      newGameState.playedCards[cardToPlay.suit]++;
    } else {
      newGameState.stormTokens--;
    }

    // Update player's hand
    newPlayer.hand = newPlayer.hand.filter(c => c.id !== selectedCardId);
    if (newGameState.deck.length > 0) {
      newPlayer.hand.push(newGameState.deck[0]);
      newGameState.deck = newGameState.deck.slice(1);
    }

    // Update players array
    newGameState.players = newGameState.players.map(p => p.id === newPlayer.id ? newPlayer : p);

    // Change turn
    newGameState.currentPlayerId = (gameState.currentPlayerId % gameState.players.length) + 1;

    setGameState(newGameState);
    setSelectedCardId(null);
  };

  const handleGiveHint = (playerId: number, hintType: 'suit' | 'rank', value: string | number) => {
    if (gameState.hintTokens === 0) return;

    const newGameState = { ...gameState };

    // Decrement hint tokens
    newGameState.hintTokens--;

    // Update hinted cards
    newGameState.players = newGameState.players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          hand: player.hand.map(card => {
            if (hintType === 'suit' && card.suit === value) {
              return { ...card, hintedSuit: true };
            } else if (hintType === 'rank' && card.rank === value) {
              return { ...card, hintedRank: true };
            }
            return card;
          })
        };
      }
      return player;
    });

    // Change turn
    newGameState.currentPlayerId = (gameState.currentPlayerId % gameState.players.length) + 1;

    setGameState(newGameState);
  };

  return (
    <div>
      <GameInfo gameState={gameState} />
      <hr />
      {gameState.players.map((player) => (
        <PlayerHand
          key={player.id}
          player={player}
          currentPlayerId={gameState.currentPlayerId}
          onSelectCard={handleSelectCard}
          selectedCardId={selectedCardId}
        />
      ))}
      <hr />
      <Controls onPlayCard={handlePlayCard} onGiveHint={handleGiveHint} players={gameState.players} currentPlayerId={gameState.currentPlayerId} />
    </div>
  );
};

export default Board;
