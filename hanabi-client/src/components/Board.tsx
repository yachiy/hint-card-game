import React from 'react';
import { GameState, Player, Suit, Card } from '../types';
import PlayerHand from './PlayerHand';
import GameInfo from './GameInfo';
import Controls from './Controls';

const suits: Suit[] = ['red', 'green', 'blue', 'yellow', 'white'];
const ranks = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let idCounter = 0;
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ id: idCounter++, suit, rank });
    });
  });
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const numPlayers = 2; // 仮に2人プレイとします。後でUIで選択できるようにします。
const cardsPerPlayer = numPlayers <= 3 ? 5 : 4;

const shuffledDeck = shuffleDeck(createDeck());

const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
  id: i + 1,
  name: `プレイヤー${i + 1}`,
  hand: [],
}));

// Deal initial hands
initialPlayers.forEach(player => {
  for (let i = 0; i < cardsPerPlayer; i++) {
    const card = shuffledDeck.shift();
    if (card) {
      player.hand.push(card);
    }
  }
});

const initialGameState: GameState = {
  players: initialPlayers,
  deck: shuffledDeck,
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

  const handleDiscardCard = () => {
    if (selectedCardId === null) return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer) return;

    const cardToDiscard = currentPlayer.hand.find(c => c.id === selectedCardId);
    if (!cardToDiscard) return;

    const newGameState = { ...gameState };
    const newPlayer = { ...currentPlayer };

    // Add card to discard pile
    newGameState.discardPile.push(cardToDiscard);

    // Increment hint tokens (max 8)
    if (newGameState.hintTokens < 8) {
      newGameState.hintTokens++;
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
      <Controls onPlayCard={handlePlayCard} onGiveHint={handleGiveHint} onDiscardCard={handleDiscardCard} players={gameState.players} currentPlayerId={gameState.currentPlayerId} hintTokens={gameState.hintTokens} />
    </div>
  );
};

export default Board;
