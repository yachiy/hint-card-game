process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit with a failure code
});

require('dotenv').config();
const WebSocket = require('ws');
const http = require('http'); // Add this line
const Game = require('./game');

// Create an HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404); // Not Found for other HTTP requests
    res.end();
  }
});

const wss = new WebSocket.Server({
  server: server, // Attach WebSocket server to the HTTP server
  verifyClient: (info, done) => {
    const { URLSearchParams } = require('url');
    const params = new URLSearchParams(info.req.url.split('?')[1] || '');
    const username = params.get('username');
    const password = params.get('password');

    if (username === process.env.AUTH_USER && password === process.env.AUTH_PASSWORD) {
      done(true);
    } else {
      done(false, 401, 'Unauthorized');
    }
  }
});

const games = new Map(); // Map to store active games: gameId -> Game instance
const clientToGameMap = new Map(); // Map to store which client belongs to which game: ws -> gameId
const clientToPlayerIdMap = new Map(); // Map to store player ID for each client: ws -> playerId

let nextGameId = 1;
let nextPlayerId = 1;

function broadcastGameState(gameId) {
  const game = games.get(gameId);
  if (!game) return;

  const state = game.getState();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && clientToGameMap.get(client) === gameId) {
      client.send(JSON.stringify({ type: 'gameState', payload: state }));
    }
  });
}

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to clean up old games
function cleanupOldGames() {
  const now = Date.now();
  const TWO_HOURS = 2 * ONE_HOUR; // 2 hours in milliseconds

  for (const [gameId, game] of games.entries()) {
    if (now - game.lastActivity > TWO_HOURS) {
      console.log(`Cleaning up old game: ${gameId}`);
      // Notify all clients in this game that it's disbanded due to inactivity
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && clientToGameMap.get(client) === gameId) {
          client.send(JSON.stringify({ type: 'gameDisbanded', payload: 'Game disbanded due to inactivity.' }));
          clientToGameMap.delete(client);
        }
      });
      games.delete(gameId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldGames, ONE_HOUR);

wss.on('connection', ws => {
  ws.isAlive = true; // Add this line
  ws.on('pong', () => { ws.isAlive = true; }); // Add this line

  const playerId = nextPlayerId++;
  clientToPlayerIdMap.set(ws, playerId);
  console.log(`Client ${playerId} connected`);

  ws.send(JSON.stringify({ type: 'playerAssigned', payload: playerId }));
  console.log(`Sent playerAssigned to client ${playerId}`);
  ws.send(JSON.stringify({ type: 'availableGames', payload: Array.from(games.values()).filter(game => !game.hasStarted).map(game => ({ id: game.gameId, name: game.displayName })) }));

  ws.on('message', message => {
    const parsedMessage = JSON.parse(message);
    const { type, payload } = parsedMessage;

    const gameId = clientToGameMap.get(ws);
    let game = gameId ? games.get(gameId) : null;

    switch (type) {
      case 'createGame':
        const newGameId = `game-${nextGameId++}`;
        game = new Game(newGameId, playerId, payload.playerName, payload.useRainbow); // Pass hostId, displayName, and useRainbow
        games.set(newGameId, game);
        clientToGameMap.set(ws, newGameId);
        // Use addPlayer for initial player as well to handle potential re-connections on game creation
        game.addPlayer(playerId, payload.playerName);
        ws.send(JSON.stringify({ type: 'gameCreated', payload: { gameId: newGameId, displayName: game.displayName } }));
        ws.send(JSON.stringify({ type: 'playerAssigned', payload: playerId }));
        console.log(`Sent playerAssigned on createGame to client ${playerId}`);
        broadcastGameState(newGameId); // ゲーム作成時にもgameStateをブロードキャスト // Send initial state to creator
        break;
      case 'joinGame':
        const targetGameId = payload.gameId;
        game = games.get(targetGameId);
        // Use addPlayer to handle re-connections for joining players
        if (game && game.addPlayer(playerId, payload.playerName)) {
          clientToGameMap.set(ws, targetGameId);
          ws.send(JSON.stringify({ type: 'gameJoined', payload: { gameId: targetGameId, displayName: game.displayName } }));
          ws.send(JSON.stringify({ type: 'playerAssigned', payload: playerId }));
          broadcastGameState(targetGameId); // Notify all players of the new state
        } else {
          ws.send(JSON.stringify({ type: 'error', payload: 'Failed to join game. It might be full or already started.' }));
        }
        break;
      case 'startGame':
        if (game && game.hostId === playerId && game.startGame()) {
          broadcastGameState(gameId);
        } else {
          ws.send(JSON.stringify({ type: 'error', payload: 'Failed to start game. Only the host can start the game.' }));
        }
        break;
      case 'playCard':
        if (game) game.playCard(playerId, payload.cardId);
        break;
      case 'giveHint':
        if (game) game.giveHint(playerId, payload.targetPlayerId, payload.hintType, payload.value);
        break;
      case 'discardCard':
        if (game) game.discardCard(playerId, payload.cardId);
        break;
      case 'disbandGame':
        if (game && game.hostId === playerId) {
          // Notify all clients in this game that it's disbanded
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && clientToGameMap.get(client) === gameId) {
              client.send(JSON.stringify({ type: 'gameDisbanded' }));
              clientToGameMap.delete(client); // Remove client from game mapping
            }
          });
          games.delete(gameId); // Remove the game instance
          console.log(`Game ${gameId} disbanded by host ${playerId}`);
        } else {
          ws.send(JSON.stringify({ type: 'error', payload: 'Failed to disband game. Only the host can disband the game.' }));
        }
        break;
      case 'ping':
        if (game) {
          game._updateActivity();
        }
        break;
      case 'requestAvailableGames':
        ws.send(JSON.stringify({ type: 'availableGames', payload: Array.from(games.values()).filter(game => !game.hasStarted).map(game => ({ id: game.gameId, name: game.displayName })) }));
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
    if (gameId && games.has(gameId)) { // Only broadcast if game still exists
      broadcastGameState(gameId);
    }
  });

  ws.on('close', () => {
    console.log(`Client ${playerId} disconnected`);
    const gameId = clientToGameMap.get(ws);
    if (gameId) {
      // Do not remove player from game on disconnect to allow re-connection
      clientToGameMap.delete(ws);
    }
    clientToPlayerIdMap.delete(ws);
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Ping clients every 30 seconds

server.listen(process.env.PORT || 8080, () => {
  console.log(`HTTP and WebSocket server started on port ${process.env.PORT || 8080}`);
});