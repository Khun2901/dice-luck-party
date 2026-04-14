// ── Main Application Entry ───────────────────────────────────
import { io } from 'socket.io-client';
import { renderLobby } from './ui/lobby.js';
import { renderWaitingRoom } from './ui/waiting-room.js';
import { renderBoard } from './ui/board-renderer.js';
import { renderDice } from './ui/dice.js';
import { renderHUD } from './ui/hud.js';

const app = document.getElementById('app');
const socket = io();

let myId = null;
let myRoomCode = null;
let roomPlayers = [];
let roomHostId = null;
let gameState = null;
let previousGameState = null;
let queuedGameState = null;
let queuedGameEvents = null;
let queuedStateTimer = null;
const GAME_STATE_WAIT_MS = 100;

function cloneState(state) {
  if (!state) return null;
  return typeof structuredClone === 'function'
    ? structuredClone(state)
    : JSON.parse(JSON.stringify(state));
}

function processEvents(events) {
  for (const event of events) {
    if (event.type === 'score') {
      const sign = event.points > 0 ? '+' : '';
      const type = event.points > 0 ? 'positive' : 'negative';
      showToast(`${event.playerName} got ${sign}${event.points}! (Score: ${event.newScore})`, type);
    } else if (event.type === 'game-end') {
      showToast(`🎉 ${event.winner.name} wins the game!`, 'positive');
    } else if (event.type === 'reveal' || event.type === 'reveal-point') {
      setTimeout(() => {
        const tileEl = document.querySelector(`.tile[data-row="${event.row}"][data-col="${event.col}"]`);
        if (tileEl) tileEl.classList.add('animate-flip');
      }, 0);

      // Auto-move logic: after a path card is revealed, if there is exactly 1 valid move, auto-move after 400ms
      setTimeout(() => {
        // Only act if it's your turn and phase is playing
        if (!gameState || !gameState.players || !gameState.players[gameState.currentPlayerIndex]) return;
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (!currentPlayer.isYou) return;
        if (gameState.phase !== 'playing') return;
        if (!gameState.diceResult || gameState.stepsRemaining <= 0) return;
        if (!gameState.validSubMoves || gameState.validSubMoves.length !== 1) return;
        const move = gameState.validSubMoves[0];
        // Send move to server
        window.dispatchEvent(new CustomEvent('auto-move-trigger'));
        socket.emit('move-player', { row: move.row, col: move.col, subPos: move.subPos }, (res) => {
          if (res?.error) showToast(res.error, 'negative');
        });
      }, 400);
    }
  }
}

function animateMoveSequence(prevState, finalState, events) {
  const moveEvents = events.filter(ev => ev.type === 'move');
  if (moveEvents.length === 0) {
    gameState = finalState;
    showGame();
    processEvents(events);
    return;
  }

  const firstMove = moveEvents[0];
  const autoMoves = moveEvents.slice(1).filter(ev => ev.auto);

  const firstState = cloneState(prevState);
  const firstPlayer = firstState.players.find(p => p.id === firstMove.playerId);
  if (firstPlayer) {
    firstPlayer.position = { ...firstMove.to };
    firstState.stepsRemaining = firstMove.stepsRemaining;
  }
  gameState = firstState;
  showGame();

  if (autoMoves.length === 0) {
    gameState = finalState;
    showGame();
    processEvents(events);
    return;
  }

  autoMoves.forEach((event, index) => {
    setTimeout(() => {
      const stepState = cloneState(prevState);
      for (let i = 0; i <= index; i++) {
        const currentEvent = moveEvents[i + 1];
        const player = stepState.players.find(p => p.id === currentEvent.playerId);
        if (player) {
          player.position = { ...currentEvent.to };
        }
      }
      stepState.stepsRemaining = autoMoves[index].stepsRemaining;
      gameState = stepState;
      showGame();
    }, (index + 1) * 400);
  });

  setTimeout(() => {
    gameState = finalState;
    showGame();
    processEvents(events);
  }, autoMoves.length * 400);
}

function processQueuedUpdate() {
  queuedStateTimer = null;
  const nextState = queuedGameState;
  const events = queuedGameEvents;
  queuedGameState = null;
  queuedGameEvents = null;

  if (nextState && events && events.some(ev => ev.type === 'move') && previousGameState) {
    animateMoveSequence(previousGameState, nextState, events);
  } else if (nextState) {
    gameState = nextState;
    showGame();
    if (events) processEvents(events);
  } else if (events) {
    processEvents(events);
  }
  previousGameState = null;
}

// ── Toast System ─────────────────────────────────────────────
function getOrCreateToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info') {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Screen Rendering ─────────────────────────────────────────

function showLobby() {
  app.innerHTML = '';
  const lobby = renderLobby(
    // Create room
    (name, boardSize) => {
      socket.emit('create-room', { playerName: name, boardSize }, (res) => {
        if (res.error) return showToast(res.error, 'negative');
        myId = socket.id;
        myRoomCode = res.roomCode;
        roomPlayers = [{ ...res.player, connected: true }];
        roomHostId = socket.id;
        showWaitingRoom();
      });
    },
    // Join room
    (name, code) => {
      socket.emit('join-room', { playerName: name, roomCode: code }, (res) => {
        if (res.error) return showToast(res.error, 'negative');
        myId = socket.id;
        myRoomCode = res.roomCode;
        showToast(`Joined room ${res.roomCode}!`, 'positive');
      });
    }
  );
  app.appendChild(lobby);
}

function showWaitingRoom() {
  app.innerHTML = '';
  const isHost = roomHostId === myId;
  const room = renderWaitingRoom(
    myRoomCode,
    roomPlayers,
    roomHostId,
    myId,
    isHost,
    // Start game
    () => {
      socket.emit('start-game', null, (res) => {
        if (res?.error) return showToast(res.error, 'negative');
      });
    },
    // Leave
    () => {
      location.reload();
    }
  );
  // Listen for remove-player event (bubbled from remove button)
  room.addEventListener('remove-player', (e) => {
    const { playerId } = e.detail;
    socket.emit('remove-player', { playerId }, (res) => {
      if (res?.error) showToast(res.error, 'negative');
    });
  });
  app.appendChild(room);
}

function showGame() {
  if (!gameState) return;

  app.innerHTML = '';

  if (gameState.phase === 'ended') {
    showGameOver();
    return;
  }

  const container = document.createElement('div');
  container.className = 'game-container';

  // Left sidebar: HUD
  const sidebar = document.createElement('div');
  sidebar.className = 'game-sidebar';
  sidebar.appendChild(renderHUD(gameState));

  // Dice
  sidebar.appendChild(
    renderDice(
      gameState,
      () => {
        socket.emit('roll-dice', null, (res) => {
          if (res?.error) showToast(res.error, 'negative');
        });
      },
      () => {
        socket.emit('end-turn', null, (res) => {
          if (res?.error) showToast(res.error, 'negative');
        });
      }
    )
  );

  container.appendChild(sidebar);

  // Board
  const board = renderBoard(gameState, (row, col, subPos) => {
    if (gameState.phase === 'selecting-start') {
      socket.emit('select-start-tile', { row, col }, (res) => {
        if (res?.error) showToast(res.error, 'negative');
      });
    } else if (gameState.phase === 'playing') {
      if (subPos === 'reveal') {
        socket.emit('reveal-tile', { row, col }, (res) => {
          if (res?.error) showToast(res.error, 'negative');
        });
      } else {
        socket.emit('move-player', { row, col, subPos }, (res) => {
          if (res?.error) showToast(res.error, 'negative');
        });
      }
    }
  });
  container.appendChild(board);

  app.appendChild(container);
}

function showGameOver() {
  app.innerHTML = '';

  // Sort players by score
  const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const el = document.createElement('div');
  el.className = 'glass-panel game-over';

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  el.innerHTML = `
    <h2>🎉 Congratulations!</h2>
    <div class="winner-name">${winner.name} wins!</div>
    <ul class="final-scores">
      ${sorted
        .map(
          (p, i) => `
        <li class="final-score-item ${i === 0 ? 'winner' : ''}">
          <span class="rank">${medals[i] || ''}</span>
          <span class="player-dot" style="background: ${p.color}; width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 8px ${p.color};"></span>
          <span class="final-score-name">${p.name}${p.isYou ? ' (you)' : ''}</span>
          <span class="final-score-value" style="color: ${p.color};">${p.score}</span>
        </li>
      `
        )
        .join('')}
    </ul>
    <button class="btn btn-primary" id="play-again-btn">🔁 Play Again</button>
  `;

  el.querySelector('#play-again-btn').addEventListener('click', () => location.reload());
  app.appendChild(el);
}

// ── Socket Events ────────────────────────────────────────────

socket.on('connect', () => {
  myId = socket.id;
  showLobby();
});

socket.on('room-update', (data) => {
  roomPlayers = data.players;
  roomHostId = data.hostId;
  if (!gameState) {
    showWaitingRoom();
  }
});

socket.on('game-state', (state) => {
  previousGameState = gameState ? cloneState(gameState) : null;
  queuedGameState = state;
  if (!queuedStateTimer) {
    queuedStateTimer = setTimeout(processQueuedUpdate, GAME_STATE_WAIT_MS);
  }
});

socket.on('game-events', (events) => {
  queuedGameEvents = events;
  if (!queuedStateTimer) {
    queuedStateTimer = setTimeout(processQueuedUpdate, GAME_STATE_WAIT_MS);
  }
});

// Handle being removed from the room by the host
socket.on('removed-from-room', () => {
  alert('You have been removed from the room by the host.');
  location.reload();
});

socket.on('disconnect', () => {
  showToast('Disconnected from server', 'negative');
});

// ── Initial render ───────────────────────────────────────────
showLobby();
