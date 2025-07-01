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
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [inputGameId, setInputGameId] = useState<string>('');

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
          setGameId(message.payload);
          break;
        case 'availableGames':
          setAvailableGames(message.payload);
          break;
        case 'error':
          console.error('Server error:', message.payload);
          alert(message.payload);
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
    sendAction('createGame', {});
  };

  const handleJoinGame = () => {
    if (inputGameId) {
      sendAction('joinGame', { gameId: inputGameId });
    }
  };

  const handleStartGame = () => {
    sendAction('startGame', {});
  };

  if (!gameId) {
    return (
      <div className="App">
        <h1>Hanabi - ロビー</h1>
        <p>Your Player ID: {myPlayerId}</p>
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
            <ul>
              {availableGames.map((id) => (
                <li key={id}>
                  {id} <button onClick={() => setInputGameId(id)}>選択</button>
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
        <h1>Hanabi - ゲームID: {gameId}</h1>
        <p>Your Player ID: {myPlayerId}</p>
        <h2>参加プレイヤー:</h2>
        <ul>
          {gameState?.players.map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
        {gameState && gameState.players.length >= 2 && (
          <button onClick={handleStartGame}>ゲームを開始</button>
        )}
        {gameState && gameState.players.length < 2 && (
          <p>ゲームを開始するには2人以上のプレイヤーが必要です。</p>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Hanabi - ゲームID: {gameId}</h1>
      <p>Your Player ID: {myPlayerId}</p>
      <Board gameState={gameState} sendAction={sendAction} myPlayerId={myPlayerId} />
    </div>
  );
}

export default App;
