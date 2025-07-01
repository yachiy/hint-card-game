require('dotenv').config();
const WebSocket = require('ws');
const Game = require('./game');

const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: (info, done) => {
    const authHeader = info.req.headers.authorization;
    if (!authHeader) {
      done(false, 401, 'Unauthorized');
      return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

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

// Function to clean up old games
function cleanupOldGames() {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
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
  const playerId = nextPlayerId++;
  clientToPlayerIdMap.set(ws, playerId);
  console.log(`Client ${playerId} connected`);

  ws.send(JSON.stringify({ type: 'playerAssigned', payload: playerId }));
  ws.send(JSON.stringify({ type: 'availableGames', payload: Array.from(games.values()).filter(game => !game.hasStarted).map(game => ({ id: game.gameId, name: game.displayName })) }));

  ws.on('message', message => {
    const parsedMessage = JSON.parse(message);
    const { type, payload } = parsedMessage;

    const gameId = clientToGameMap.get(ws);
    let game = gameId ? games.get(gameId) : null;

    switch (type) {
      case 'createGame':
        const newGameId = `game-${nextGameId++}`;
        game = new Game(newGameId, playerId, payload.playerName); // Pass hostId and displayName
        games.set(newGameId, game);
        clientToGameMap.set(ws, newGameId);
        game.addPlayer(playerId, payload.playerName);
        ws.send(JSON.stringify({ type: 'gameCreated', payload: { gameId: newGameId, displayName: game.displayName } }));
        broadcastGameState(newGameId);
        break;
      case 'joinGame':
        const targetGameId = payload.gameId;
        game = games.get(targetGameId);
        if (game && !game.hasStarted && game.addPlayer(playerId, payload.playerName)) {
          clientToGameMap.set(ws, targetGameId);
          ws.send(JSON.stringify({ type: 'gameJoined', payload: { gameId: targetGameId, displayName: game.displayName } }));
          broadcastGameState(targetGameId);
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
        if (game) game.giveHint(payload.targetPlayerId, payload.hintType, payload.value);
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
      // Handle player leaving game (e.g., remove player, end game if no players left)
      // For simplicity, we'll just remove the client mapping for now.
      clientToGameMap.delete(ws);
      // If a game becomes empty, you might want to delete it:
      // if (games.get(gameId) && games.get(gameId).players.length === 0) {
      //   games.delete(gameId);
      // }
    }
    clientToPlayerIdMap.delete(ws);
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server started on port 8080');