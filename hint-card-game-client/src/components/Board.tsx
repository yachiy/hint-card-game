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

  const isMyTurn = myPlayerId === gameState.currentPlayerId;
  const currentPlayerName = gameState.players.find(p => p.id === gameState.currentPlayerId)?.name || '不明';

  const handleSelectCard = (cardId: number) => {
    if (isMyTurn) {
      setSelectedCardId(cardId);
    }
  };

  const handlePlayCard = () => {
    if (selectedCardId === null || myPlayerId === null || !isMyTurn) return;
    sendAction('playCard', { cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleGiveHint = (playerId: number, hintType: 'suit' | 'rank', value: string | number) => {
    if (myPlayerId === null || !isMyTurn) return;
    sendAction('giveHint', { targetPlayerId: playerId, hintType, value });
  };

  const handleDiscardCard = () => {
    if (selectedCardId === null || myPlayerId === null || !isMyTurn) return;
    sendAction('discardCard', { cardId: selectedCardId });
    setSelectedCardId(null);
  };

  return (
    <div>
      <GameInfo gameState={gameState} />
      <hr />
      <h2>現在のターン: {currentPlayerName}</h2>
      {gameState.players.map((player) => (
        <PlayerHand
          key={player.id}
          player={player}
          currentPlayerId={gameState.currentPlayerId || 0}
          onSelectCard={handleSelectCard}
          selectedCardId={selectedCardId}
          isMyHand={player.id === myPlayerId}
          isMyTurn={isMyTurn}
        />
      ))}
      <hr />
      <Controls
        onPlayCard={handlePlayCard}
        onGiveHint={handleGiveHint}
        onDiscardCard={handleDiscardCard}
        players={gameState.players}
        currentPlayerId={gameState.currentPlayerId || 0}
        hintTokens={gameState.hintTokens}
        isMyTurn={isMyTurn}
      />
    </div>
  );
};

export default Board;
