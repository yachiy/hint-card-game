import React from 'react';
import { GameState, Player, Suit, Card } from '../types';
import PlayerHand from './PlayerHand';
import GameInfo from './GameInfo';
import Controls from './Controls';

interface BoardProps {
  gameState: GameState;
  sendAction: (type: string, payload: any) => void;
  myPlayerId: number | null;
}

const Board: React.FC<BoardProps> = ({ gameState, sendAction, myPlayerId }) => {
  const [selectedCardId, setSelectedCardId] = React.useState<number | null>(null);

  const handleSelectCard = (cardId: number) => {
    setSelectedCardId(cardId);
  };

  const handlePlayCard = () => {
    if (selectedCardId === null || myPlayerId === null) return;
    sendAction('playCard', { cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleGiveHint = (playerId: number, hintType: 'suit' | 'rank', value: string | number) => {
    if (myPlayerId === null) return;
    sendAction('giveHint', { targetPlayerId: playerId, hintType, value });
  };

  const handleDiscardCard = () => {
    if (selectedCardId === null || myPlayerId === null) return;
    sendAction('discardCard', { cardId: selectedCardId });
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
          currentPlayerId={gameState.currentPlayerId || 0} // Fallback to 0 or handle null appropriately
          onSelectCard={handleSelectCard}
          selectedCardId={selectedCardId}
          isMyHand={player.id === myPlayerId}
        />
      ))}
      <hr />
      <Controls
        onPlayCard={handlePlayCard}
        onGiveHint={handleGiveHint}
        onDiscardCard={handleDiscardCard}
        players={gameState.players}
        currentPlayerId={gameState.currentPlayerId || 0} // Fallback to 0 or handle null appropriately
        hintTokens={gameState.hintTokens}
      />
    </div>
  );
};

export default Board;
