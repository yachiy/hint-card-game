import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  isOwnHand?: boolean;
  isSelected?: boolean;
}

export const japaneseSuitNames: { [key: string]: string } = {
  red: '赤',
  green: '緑',
  blue: '青',
  yellow: '黄',
  white: '白',
  rainbow: '虹',
};

const Card: React.FC<CardProps> = ({ card, isOwnHand, isSelected }) => {
  const cardColors: { [key: string]: string } = {
    red: '#FF4136',
    green: '#2ECC40',
    blue: '#0074D9',
    yellow: '#FFDC00',
    white: '#F0F0F0',
    rainbow: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
  };

  const cardStyle: React.CSSProperties = {
    border: isSelected ? '3px solid #0074D9' : '1px solid #333',
    borderRadius: '8px',
    width: '90px',
    height: '130px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '8px',
    background: isOwnHand ? '#666' : cardColors[card.suit],
    color: isOwnHand ? 'white' : (card.suit === '黄' || card.suit === '白' ? '#333' : 'white'),
    cursor: isOwnHand ? 'pointer' : 'default',
    boxShadow: (card.hintedSuit || card.hintedRank) ? '0 0 12px 6px gold' : 'none',
    position: 'relative',
    fontSize: '2.5em',
    fontWeight: 'bold',
    textShadow: isOwnHand ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)',
  };

  const hintStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: '0.7em',
    fontWeight: 'normal',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white', /* ヒント文字色を白に固定 */
    padding: '2px 5px',
    borderRadius: '3px',
    zIndex: 1,
  };

  return (
    <div style={cardStyle}>
      {isOwnHand ? (
        <>
          {card.hintedSuit && <div style={{ ...hintStyle, top: '5px', left: '5px', backgroundColor: cardColors[card.suit], border: '2px solid gray' }}></div>}
          {card.hintedRank && <div style={{ ...hintStyle, bottom: '5px', right: '5px' }}>{card.rank}</div>}
        </>
      ) : (
        <>
          {card.hintedSuit && <div style={{ ...hintStyle, top: '5px', left: '5px', backgroundColor: cardColors[card.suit], border: '2px solid gray' }}></div>}
          {card.hintedRank && <div style={{ ...hintStyle, bottom: '5px', right: '5px' }}>{card.rank}</div>}
          <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>{card.rank}</div>
        </>
      )}
    </div>
  );
};

export default Card;
