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
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>{player.name} {isMyHand && '(あなた)'}</h3>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', justifyContent: 'flex-start', gap: '10px', padding: '10px 0' }}>
        {player.hand.map((card) => (
          <div key={card.id} onClick={() => isMyHand && isMyTurn && onSelectCard(card.id)} style={{ flexShrink: 0, minWidth: 0 }}>
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
