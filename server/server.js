import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameState } from './game-logic.js';

const app = express();
const httpServer = createServer(app);
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ── Room Management ──────────────────────────────────────────────

const rooms = new Map(); // roomCode → GameState

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

// ── Socket.IO Events ─────────────────────────────────────────────

io.on('connection', (socket) => {
  let currentRoom = null;
  socket.on('remove-player', ({ playerId }, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });
    if (socket.id !== game.hostId) return callback?.({ error: 'Only host can remove players' });
    if (playerId === game.hostId) return callback?.({ error: 'Cannot remove host' });
    const playerIdx = game.players.findIndex(p => p.id === playerId);
    if (playerIdx === -1) return callback?.({ error: 'Player not found' });
    game.removePlayer(playerId);
    // Broadcast to all sockets in the room and the removed player
    const update = {
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        connected: p.connected,
      })),
      hostId: game.hostId,
    };
    io.to(currentRoom).emit('room-update', update);
    io.to(playerId).emit('room-update', update); // ensure removed player gets update too
    callback?.({ success: true });
    // If the removed player is connected, forcibly disconnect them
    io.to(playerId).emit('removed-from-room');
  });
  console.log(`[connect] ${socket.id}`);

  socket.on('create-room', ({ playerName, boardSize }, callback) => {
    const code = generateRoomCode();
    const game = new GameState(boardSize || 7);
    const player = game.addPlayer(socket.id, playerName);
    rooms.set(code, game);
    currentRoom = code;

    socket.join(code);
    callback({ roomCode: code, player });
    console.log(`[room] ${playerName} created room ${code} (Size: ${boardSize || 7})`);
  });

  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    const code = roomCode.toUpperCase();
    const game = rooms.get(code);

    if (!game) return callback({ error: 'Room not found' });
    if (game.phase !== 'waiting') return callback({ error: 'Game already started' });
    if (game.players.length >= 6) return callback({ error: 'Room is full' });

    const player = game.addPlayer(socket.id, playerName);
    currentRoom = code;

    socket.join(code);
    callback({ roomCode: code, player });

    // Notify all players in room
    io.to(code).emit('room-update', {
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        connected: p.connected,
      })),
      hostId: game.hostId,
    });
    console.log(`[room] ${playerName} joined room ${code}`);
  });

  socket.on('start-game', (_, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });
    if (socket.id !== game.hostId) return callback?.({ error: 'Only host can start' });

    game.startGame();

    // Send initial state to each player
    for (const player of game.players) {
      io.to(player.id).emit('game-state', game.toClientState(player.id));
    }
    callback?.({ success: true });
    console.log(`[game] Room ${currentRoom} started`);
  });

  socket.on('select-start-tile', ({ row, col }, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });

    const result = game.selectStartTile(socket.id, row, col);
    if (result.error) return callback?.({ error: result.error });

    // Broadcast updated state
    for (const player of game.players) {
      io.to(player.id).emit('game-state', game.toClientState(player.id));
    }
    callback?.({ success: true });
  });

  socket.on('roll-dice', (_, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });
    if (game.getCurrentPlayer()?.id !== socket.id) return callback?.({ error: 'Not your turn' });

    const result = game.rollDice();

    // Broadcast updated state
    for (const player of game.players) {
      io.to(player.id).emit('game-state', game.toClientState(player.id));
    }
    callback?.({ diceResult: result });
  });

  socket.on('move-player', ({ row, col, subPos }, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });
    if (game.getCurrentPlayer()?.id !== socket.id) return callback?.({ error: 'Not your turn' });

    const result = game.movePlayer(row, col, subPos);
    if (result.error) return callback?.({ error: result.error });

    // Broadcast updated state with events
    for (const player of game.players) {
      io.to(player.id).emit('game-state', game.toClientState(player.id));
    }
    io.to(currentRoom).emit('game-events', result.events);
    callback?.({ success: true, events: result.events });
  });

  socket.on('reveal-tile', ({ row, col }, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });
    if (game.getCurrentPlayer()?.id !== socket.id) return callback?.({ error: 'Not your turn' });

    const result = game.revealTile(row, col);
    if (result.error) return callback?.({ error: result.error });

    for (const player of game.players) {
      io.to(player.id).emit('game-state', game.toClientState(player.id));
    }
    io.to(currentRoom).emit('game-events', result.events);
    callback?.({ success: true, events: result.events });
  });

  socket.on('end-turn', (_, callback) => {
    const game = rooms.get(currentRoom);
    if (!game) return callback?.({ error: 'No room' });
    if (game.getCurrentPlayer()?.id !== socket.id) return callback?.({ error: 'Not your turn' });

    const result = game.endTurn();
    if (result && result.error) return callback?.({ error: result.error });

    for (const player of game.players) {
      io.to(player.id).emit('game-state', game.toClientState(player.id));
    }
    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    if (currentRoom) {
      const game = rooms.get(currentRoom);
      if (game) {
        game.removePlayer(socket.id);
        io.to(currentRoom).emit('room-update', {
          players: game.players.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            connected: p.connected,
          })),
          hostId: game.hostId,
        });

        // Broadcast state if game is active
        if (game.phase !== 'waiting') {
          for (const player of game.players) {
            if (player.connected) {
              io.to(player.id).emit('game-state', game.toClientState(player.id));
            }
          }
        }

        // Clean up empty rooms
        if (game.players.every(p => !p.connected)) {
          rooms.delete(currentRoom);
          console.log(`[room] Room ${currentRoom} deleted (empty)`);
        }
      }
    }
  });
});

// ── Start Server ─────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎲 Dice Luck Party server running on http://0.0.0.0:${PORT}`);
});
