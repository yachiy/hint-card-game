import React, { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Board from './components/Board';
import { GameState } from './types';

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

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameDisplayName, setGameDisplayName] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<{ id: string; name: string }[]>([]);
  const [inputGameId, setInputGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080';
    const newWs = new WebSocket(`${wsUrl}?username=${username}&password=${password}`);

    newWs.onopen = () => {
      console.log('WebSocket connection established.');
      // Keep-alive mechanism: send a ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (newWs.readyState === WebSocket.OPEN) {
          newWs.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds

      // Clear interval on close
      newWs.onclose = () => {
        console.log('WebSocket connection closed.');
        clearInterval(pingInterval);
        setGameState(null);
        setGameId(null);
        setGameDisplayName(null);
      };
    };

    newWs.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const message = JSON.parse(event.data as string);
      switch (message.type) {
        case 'gameState':
          setGameState(message.payload);
          console.log('Received gameState:', message.payload);
          console.log('isGameOver from gameState:', message.payload.isGameOver);
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
          alert(message.payload);
          break;
        case 'gameDisbanded':
          setGameState(null);
          setGameId(null);
          setGameDisplayName(null);
          break;
        default:
          
      }
    };

    newWs.onclose = () => {
      console.log('WebSocket connection closed.');
      setGameState(null);
      setGameId(null);
      setGameDisplayName(null);
    };

    newWs.onerror = (error) => {
      alert('認証に失敗しました。ユーザー名とパスワードを確認してください。');
      setIsAuthenticated(false); // 認証状態をリセット
    };

    setWs(newWs);

    return () => {
      newWs.close();
    };
  }, [isAuthenticated, username, password]); // 認証状態と認証情報が変更されたら再接続

  const handleAuthenticate = () => {
    if (username.trim() === '' || password.trim() === '') {
      alert('ユーザー名とパスワードを入力してください。');
      return;
    }
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="stars">{generateStars()}</div>
        <h1>Hint Card Game - ログイン</h1>
        <div>
          <h2>ユーザー名</h2>
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <h2>パスワード</h2>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button onClick={handleAuthenticate}>ログイン</button>
      </div>
    );
  }

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
        <h1>Hint Card Game - ロビー</h1>
        <div>
          <h2>プレイヤー名</h2>
          <input
            type="text"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => {
              
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
        <h1>Hint Card Game - {gameDisplayName} ({gameId})</h1>
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

  const isGameOver = gameState && gameState.isGameOver;

  if (isGameOver) {
    return (
      <div className="App">
        <div className="stars">{generateStars()}</div>
        <h1>Hint Card Game - {gameDisplayName} ({gameId})</h1>
        <h2>ゲームオーバー</h2>
        <p>ゲームが終了しました。</p>
        {gameState && gameState.hostId === myPlayerId && (
          <button onClick={handleDisbandGame}>ゲームを解散</button>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <div className="stars">{generateStars()}</div>
      <h1>Hint Card Game - {gameDisplayName} ({gameId})</h1>
      {gameState && gameState.hostId === myPlayerId && (
        <button onClick={handleDisbandGame}>ゲームを解散</button>
      )}
      <div style={{ padding: '20px' }}>
        <Board gameState={gameState} sendAction={sendAction} myPlayerId={myPlayerId} />
      </div>
    </div>
  );
}

export default App;

