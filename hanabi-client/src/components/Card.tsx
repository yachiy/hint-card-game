import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  isOwnHand?: boolean;
  isSelected?: boolean;
}

const Card: React.FC<CardProps> = ({ card, isOwnHand, isSelected }) => {
  const cardStyle: React.CSSProperties = {
    border: isSelected ? '3px solid blue' : '1px solid black',
    borderRadius: '5px',
    width: '80px',
    height: '120px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '5px',
    backgroundColor: isOwnHand ? 'grey' : card.suit,
    color: card.suit === 'yellow' || card.suit === 'white' ? 'black' : 'white',
    cursor: isOwnHand ? 'pointer' : 'default',
    boxShadow: (card.hintedSuit || card.hintedRank) ? '0 0 10px 5px gold' : 'none',
  };

  return (
    <div style={cardStyle}>
      {isOwnHand ? null : <h2>{card.rank}</h2>}
    </div>
  );
};

export default Card;
