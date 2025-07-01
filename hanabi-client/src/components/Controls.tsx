import React from 'react';
import { Player, Suit } from '../types';

interface ControlsProps {
  onPlayCard: () => void;
  onGiveHint: (playerId: number, hintType: 'suit' | 'rank', value: string | number) => void;
  onDiscardCard: () => void;
  players: Player[];
  currentPlayerId: number;
  hintTokens: number;
}

const Controls: React.FC<ControlsProps> = ({ onPlayCard, onGiveHint, onDiscardCard, players, currentPlayerId, hintTokens }) => {
  const [hintTargetPlayerId, setHintTargetPlayerId] = React.useState<number | null>(null);
  const [hintType, setHintType] = React.useState<'suit' | 'rank' | null>(null);
  const [hintValue, setHintValue] = React.useState<string | number | null>(null);

  const suits: Suit[] = ['red', 'green', 'blue', 'yellow', 'white'];
  const ranks = [1, 2, 3, 4, 5];

  const handleGiveHintClick = () => {
    if (hintTargetPlayerId !== null && hintType !== null && hintValue !== null && hintTokens > 0) {
      onGiveHint(hintTargetPlayerId, hintType, hintValue);
      setHintTargetPlayerId(null);
      setHintType(null);
      setHintValue(null);
    }
  };

  const isHintButtonDisabled = hintTokens === 0 || hintTargetPlayerId === null || hintType === null || hintValue === null;

  return (
    <div>
      <h4>操作</h4>
      <button onClick={onPlayCard}>カードをプレイ</button>
      <button onClick={handleGiveHintClick} disabled={isHintButtonDisabled}>ヒントを出す</button>
      <button onClick={onDiscardCard}>カードを捨てる</button>
      <div>
        <h5>ヒント</h5>
        <select value={hintTargetPlayerId || ''} onChange={(e) => setHintTargetPlayerId(Number(e.target.value))}>
          <option value="">ヒントを出す相手</option>
          {players.filter(p => p.id !== currentPlayerId).map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
        <select value={hintType || ''} onChange={(e) => setHintType(e.target.value as 'suit' | 'rank')}>
          <option value="">ヒントの種類</option>
          <option value="suit">色</option>
          <option value="rank">数字</option>
        </select>
        {hintType === 'suit' && (
          <select value={hintValue || ''} onChange={(e) => setHintValue(e.target.value)}>
            <option value="">色を選択</option>
            {suits.map(suit => (
              <option key={suit} value={suit}>{suit}</option>
            ))}
          </select>
        )}
        {hintType === 'rank' && (
          <select value={hintValue || ''} onChange={(e) => setHintValue(Number(e.target.value))}>
            <option value="">数字を選択</option>
            {ranks.map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Controls;
