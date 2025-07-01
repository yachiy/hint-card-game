import React from 'react';
import { Player } from '../types';
import Card from './Card';

interface PlayerHandProps {
  player: Player;
  currentPlayerId: number;
  onSelectCard: (cardId: number) => void;
  selectedCardId: number | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, currentPlayerId, onSelectCard, selectedCardId }) => {
  const isOwnHand = player.id === currentPlayerId;

  return (
    <div>
      <h3>{player.name}</h3>
      <div style={{ display: 'flex' }}>
        {player.hand.map((card) => (
          <div key={card.id} onClick={() => isOwnHand && onSelectCard(card.id)}>
            <Card
              card={card}
              isOwnHand={isOwnHand}
              isSelected={selectedCardId === card.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;
