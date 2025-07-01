import React from 'react';
import { GameState } from '../types';
import Card from './Card';

interface GameInfoProps {
  gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState }) => {
  const [showDiscardPile, setShowDiscardPile] = React.useState(false);

  return (
    <div>
      <h4>ゲーム情報</h4>
      <p>ヒントトークン: {gameState.hintTokens}</p>
      <p>ストームトークン: {gameState.stormTokens}</p>
      <p>山札の残り枚数: {gameState.deckSize}</p>
      <div>
        <h5>プレイされたカード</h5>
        <div style={{ display: 'flex', gap: '10px' }}>
          {Object.entries(gameState.playedCards).map(([suit, rank]) => (
            <div key={suit} style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '5px', color: '#FFFFFF' }}>{suit}</div>
              <Card card={{ id: -1, suit: suit as any, rank }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h5 style={{ display: 'inline-block', marginRight: '10px' }}>捨て札</h5>
        <button onClick={() => setShowDiscardPile(!showDiscardPile)}>
          {showDiscardPile ? '非表示' : '表示'}
        </button>
        {showDiscardPile && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
            {gameState.discardPile.map(card => (
              <Card key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInfo;
