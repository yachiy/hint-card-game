import React, { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Board from './components/Board';
import { GameState } from './types';

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameDisplayName, setGameDisplayName] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<{ id: string; name: string }[]>([]);
  const [inputGameId, setInputGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  // 星を生成する関数
  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 100; i++) { // 100個の星を生成
      const size = Math.random() * 3 + 1; // 1pxから4px
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = Math.random() * 5 + 5; // 5秒から10秒
      const delay = Math.random() * 5; // 0秒から5秒
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}vh`,
            left: `${left}vw`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        />
      );
    }
    return stars;
  };

  useEffect(() => {
    const newWs = new WebSocket('ws://localhost:8080');

    newWs.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data as string);
      switch (message.type) {
        case 'gameState':
          setGameState(message.payload);
          break;
        case 'playerAssigned':
          setMyPlayerId(message.payload);
          break;
        case 'gameCreated':
        case 'gameJoined':
          setGameId(message.payload.gameId);
          setGameDisplayName(message.payload.displayName);
          break;
        case 'availableGames':
          setAvailableGames(message.payload);
          break;
        case 'error':
          console.error('Server error:', message.payload);
          alert(message.payload);
          break;
        case 'gameDisbanded':
          setGameState(null);
          setMyPlayerId(null);
          setGameId(null);
          setGameDisplayName(null);
          break;
        default:
          console.log('Unknown message type:', message.type, message.payload);
      }
    };

    newWs.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setGameState(null);
      setMyPlayerId(null);
      setGameId(null);
      setGameDisplayName(null);
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(newWs);

    return () => {
      newWs.close();
    };
  }, []);

  const sendAction = (type: string, payload: any) => {
    if (ws) {
      ws.send(JSON.stringify({ type, payload }));
    }
  };

  const handleCreateGame = () => {
    if (playerName.trim() === '') {
      alert('プレイヤー名を入力してください。');
      return;
    }
    sendAction('createGame', { playerName });
  };

  const handleJoinGame = () => {
    if (playerName.trim() === '') {
      alert('プレイヤー名を入力してください。');
      return;
    }
    if (inputGameId) {
      sendAction('joinGame', { gameId: inputGameId, playerName });
    }
  };

  const handleStartGame = () => {
    sendAction('startGame', {});
  };

  const handleDisbandGame = () => {
    if (window.confirm('本当にゲームを解散しますか？')) {
      sendAction('disbandGame', {});
    }
  };

  if (!gameId) {
    return (
      <div className="App">
        <div className="stars">{generateStars()}</div>
        <h1>Hanabi - ロビー</h1>
        <p>Your Player ID: {myPlayerId}</p>
        <div>
          <h2>プレイヤー名</h2>
          <input
            type="text"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => {
              console.log('Player name input changed:', e.target.value);
              setPlayerName(e.target.value);
            }}
          />
        </div>
        <div>
          <h2>ゲームを作成</h2>
          <button onClick={handleCreateGame}>新しいゲームを作成</button>
        </div>
        <div>
          <h2>ゲームに参加</h2>
          <input
            type="text"
            placeholder="ゲームIDを入力"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
          />
          <button onClick={handleJoinGame}>参加</button>
        </div>
        <div>
          <h2>利用可能なゲーム</h2>
          {availableGames.length === 0 ? (
            <p>利用可能なゲームはありません。</p>
          ) : (
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {availableGames.map((game) => (
                <li key={game.id}>
                  {game.name} ({game.id}) <button onClick={() => setInputGameId(game.id)}>選択</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (!gameState || !gameState.hasStarted) {
    return (
      <div className="App">
        <div className="stars">{generateStars()}</div>
        <h1>Hanabi - {gameDisplayName} ({gameId})</h1>
        <p>Your Player ID: {myPlayerId}</p>
        <h2>参加プレイヤー:</h2>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {gameState?.players.map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
        {gameState && gameState.players.length >= 2 && gameState.hostId === myPlayerId && (
          <button onClick={handleStartGame}>ゲームを開始</button>
        )}
        {gameState && gameState.hostId === myPlayerId && (
          <button onClick={handleDisbandGame}>ゲームを解散</button>
        )}
        {gameState && gameState.players.length < 2 && (
          <p>ゲームを開始するには2人以上のプレイヤーが必要です。</p>
        )}
        {gameState && gameState.hostId !== myPlayerId && (
          <p>ホストのみがゲームを開始できます。</p>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <div className="stars">{generateStars()}</div>
      <h1>Hanabi - {gameDisplayName} ({gameId})</h1>
      <p>Your Player ID: {myPlayerId}</p>
      {gameState && gameState.hostId === myPlayerId && (
        <button onClick={handleDisbandGame}>ゲームを解散</button>
      )}
      <Board gameState={gameState} sendAction={sendAction} myPlayerId={myPlayerId} />
    </div>
  );
}

export default App;

