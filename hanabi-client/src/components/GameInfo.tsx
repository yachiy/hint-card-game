import React from 'react';
import { GameState } from '../types';
import Card from './Card';

interface GameInfoProps {
  gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState }) => {
  return (
    <div>
      <h4>ゲーム情報</h4>
      <p>ヒントトークン: {gameState.hintTokens}</p>
      <p>ストームトークン: {gameState.stormTokens}</p>
      <p>山札の残り枚数: {gameState.deck.length}</p>
      <div>
        <h5>プレイされたカード</h5>
        <div style={{ display: 'flex', gap: '10px' }}>
          {Object.entries(gameState.playedCards).map(([suit, rank]) => (
            <div key={suit} style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '5px' }}>{suit}</div>
              <Card card={{ id: -1, suit: suit as any, rank }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
