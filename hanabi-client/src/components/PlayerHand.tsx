import React from 'react';
import { Player } from '../types';
import Card from './Card';

interface PlayerHandProps {
  player: Player;
  currentPlayerId: number | null;
  onSelectCard: (cardId: number) => void;
  selectedCardId: number | null;
  isMyHand: boolean;
  isMyTurn: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, currentPlayerId, onSelectCard, selectedCardId, isMyHand, isMyTurn }) => {
  const isOwnHand = player.id === currentPlayerId;

  return (
    <div>
      <h3>{player.name} {isMyHand && '(あなた)'}</h3>
      <div style={{ display: 'flex' }}>
        {player.hand.map((card) => (
          <div key={card.id} onClick={() => isMyHand && isMyTurn && onSelectCard(card.id)}>
            <Card
              card={card}
              isOwnHand={isMyHand}
              isSelected={selectedCardId === card.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;
