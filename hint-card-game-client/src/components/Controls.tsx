import React from 'react';
import { Player, Suit } from '../types';
import { japaneseSuitNames } from './Card';

interface ControlsProps {
  onPlayCard: () => void;
  onGiveHint: (playerId: number, hintType: 'suit' | 'rank', value: string | number) => void;
  onDiscardCard: () => void;
  players: Player[];
  currentPlayerId: number | null;
  hintTokens: number;
  isMyTurn: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onPlayCard, onGiveHint, onDiscardCard, players, currentPlayerId, hintTokens, isMyTurn }) => {
  const [hintTargetPlayerId, setHintTargetPlayerId] = React.useState<number | null>(null);
  const [hintType, setHintType] = React.useState<'suit' | 'rank' | null>(null);
  const [hintValue, setHintValue] = React.useState<string | number | null>(null);

  const targetPlayer = players.find(p => p.id === hintTargetPlayerId);
  const availableSuits: Suit[] = targetPlayer ? Array.from(new Set(targetPlayer.hand.map(card => card.suit))) : [];
  const availableRanks = targetPlayer ? Array.from(new Set(targetPlayer.hand.map(card => card.rank))) : [];

  React.useEffect(() => {
    setHintType(null);
    setHintValue(null);
  }, [hintTargetPlayerId]);

  React.useEffect(() => {
    setHintValue(null);
  }, [hintType]);


  const handleGiveHintClick = () => {
    if (hintTargetPlayerId !== null && hintType !== null && hintValue !== null && hintTokens > 0 && isMyTurn) {
      onGiveHint(hintTargetPlayerId, hintType, hintValue);
      setHintTargetPlayerId(null);
      setHintType(null);
      setHintValue(null);
    }
  };

  const isHintButtonDisabled = hintTokens === 0 || hintTargetPlayerId === null || hintType === null || hintValue === null || !isMyTurn;

  return (
    <div>
      <h4>操作</h4>
      <button onClick={onPlayCard} disabled={!isMyTurn}>カードをプレイ</button>
      <button onClick={handleGiveHintClick} disabled={isHintButtonDisabled}>ヒントを出す</button>
      <button onClick={onDiscardCard} disabled={!isMyTurn}>カードを捨てる</button>
      <div>
        <h5>ヒント</h5>
        <select value={hintTargetPlayerId || ''} onChange={(e) => setHintTargetPlayerId(Number(e.target.value))}>
          <option value="">ヒントを出す相手</option>
          {players.filter(p => p.id !== currentPlayerId).map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
        <select value={hintType || ''} onChange={(e) => setHintType(e.target.value as 'suit' | 'rank')} disabled={!hintTargetPlayerId}>
          <option value="">ヒントの種類</option>
          <option value="suit">色</option>
          <option value="rank">数字</option>
        </select>
        {hintType === 'suit' && (
          <select value={hintValue || ''} onChange={(e) => setHintValue(e.target.value)}>
            <option value="">色を選択</option>
            {availableSuits.map(suit => (
              <option key={suit} value={suit}>{japaneseSuitNames[suit]}</option>
            ))}
          </select>
        )}
        {hintType === 'rank' && (
          <select value={hintValue || ''} onChange={(e) => setHintValue(Number(e.target.value))}>
            <option value="">数字を選択</option>
            {availableRanks.sort((a, b) => a - b).map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Controls;
