// ── Board & Path Generation ──────────────────────────────────────
const DIRECTIONS = ['top', 'bottom', 'left', 'right'];
const BOARD_SIZE = 7;

const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const DELTA = { top: [-1, 0], bottom: [1, 0], left: [0, -1], right: [0, 1] };

/**
 * Returns directions that would go off-board for a given (row, col).
 */
function getBorderRestrictions(row, col, boardSize) {
  const restricted = [];
  if (row === 0) restricted.push('top');
  if (row === boardSize - 1) restricted.push('bottom');
  if (col === 0) restricted.push('left');
  if (col === boardSize - 1) restricted.push('right');
  return restricted;
}

/**
 * Check if two adjacent tiles connect to each other.
 */
function tilesConnect(board, r1, c1, r2, c2, boardSize) {
  if (r2 < 0 || r2 >= boardSize || c2 < 0 || c2 >= boardSize) return false;
  const t1 = board[r1][c1];
  const t2 = board[r2][c2];

  // Determine direction from t1 to t2
  const dr = r2 - r1;
  const dc = c2 - c1;
  let dir;
  if (dr === -1) dir = 'top';
  else if (dr === 1) dir = 'bottom';
  else if (dc === -1) dir = 'left';
  else if (dc === 1) dir = 'right';
  else return false;

  return t1.directions.includes(dir) && t2.directions.includes(OPPOSITE[dir]);
}

/**
 * Flood-fill to check connectivity of the entire board.
 */
function isFullyConnected(board, boardSize) {
  const visited = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
  const queue = [[0, 0]];
  visited[0][0] = true;
  let count = 1;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const dir of board[r][c].directions) {
      const [dr, dc] = DELTA[dir];
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && !visited[nr][nc]) {
        // Check mutual connection
        if (board[nr][nc].directions.includes(OPPOSITE[dir])) {
          visited[nr][nc] = true;
          count++;
          queue.push([nr, nc]);
        }
      }
    }
  }

  return count === boardSize * boardSize;
}

/**
 * Generate a connected NxN board.
 */
function generateConnectedBoard(boardSize) {
  // Initialize empty grid
  const board = Array.from({ length: boardSize }, (_, r) =>
    Array.from({ length: boardSize }, (_, c) => ({
      type: 'path',
      directions: [],
      points: null,
      revealed: false,
      row: r,
      col: c,
    }))
  );

  // Use randomized DFS to build a spanning tree
  const visited = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
  const stack = [[0, 0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const restricted = new Set(getBorderRestrictions(r, c, boardSize));
    const neighbors = DIRECTIONS
      .filter(d => !restricted.has(d))
      .map(d => {
        const [dr, dc] = DELTA[d];
        return { dir: d, nr: r + dr, nc: c + dc };
      })
      .filter(({ nr, nc }) => !visited[nr][nc]);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    // Pick random unvisited neighbor
    const { dir, nr, nc } = neighbors[Math.floor(Math.random() * neighbors.length)];

    // Connect current → neighbor and neighbor → current
    board[r][c].directions.push(dir);
    board[nr][nc].directions.push(OPPOSITE[dir]);

    visited[nr][nc] = true;
    stack.push([nr, nc]);
  }

  // Add extra random connections to make the board more interesting
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const restricted = new Set(getBorderRestrictions(r, c, boardSize));
      const current = new Set(board[r][c].directions);

      for (const dir of DIRECTIONS) {
        if (restricted.has(dir) || current.has(dir)) continue;
        if (Math.random() < 0.35) {
          const [dr, dc] = DELTA[dir];
          const nr = r + dr;
          const nc = c + dc;
          board[r][c].directions.push(dir);
          if (!board[nr][nc].directions.includes(OPPOSITE[dir])) {
            board[nr][nc].directions.push(OPPOSITE[dir]);
          }
        }
      }
    }
  }

  // Ensure minimum 2 directions per tile
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const tile = board[r][c];
      const restricted = new Set(getBorderRestrictions(r, c, boardSize));
      while (tile.directions.length < 2) {
        const available = DIRECTIONS.filter(
          d => !restricted.has(d) && !tile.directions.includes(d)
        );
        if (available.length === 0) break;
        const dir = available[Math.floor(Math.random() * available.length)];
        const [dr, dc] = DELTA[dir];
        const nr = r + dr;
        const nc = c + dc;
        tile.directions.push(dir);
        if (!board[nr][nc].directions.includes(OPPOSITE[dir])) {
          board[nr][nc].directions.push(OPPOSITE[dir]);
        }
      }
    }
  }

  return board;
}

/**
 * Place point cards randomly on inner tiles.
 */
function placePointCards(board, boardSize, count) {
  const innerTiles = [];
  for (let r = 1; r < boardSize - 1; r++) {
    for (let c = 1; c < boardSize - 1; c++) {
      innerTiles.push([r, c]);
    }
  }

  // Shuffle inner tiles
  for (let i = innerTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [innerTiles[i], innerTiles[j]] = [innerTiles[j], innerTiles[i]];
  }

  // Distribution: roughly 40% (+1), 40% (+2), 20% (-1)
  const plus1 = Math.floor(count * 0.4);
  const plus2 = Math.ceil(count * 0.4);
  const minus1 = count - plus1 - plus2;

  const pointValues = [];
  for (let i = 0; i < plus1; i++) pointValues.push(1);
  for (let i = 0; i < plus2; i++) pointValues.push(2);
  for (let i = 0; i < minus1; i++) pointValues.push(-1);

  // Shuffle point values
  for (let i = pointValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pointValues[i], pointValues[j]] = [pointValues[j], pointValues[i]];
  }

  for (let i = 0; i < count; i++) {
    const [r, c] = innerTiles[i];
    board[r][c].type = 'point';
    board[r][c].points = pointValues[i];
  }
}

/**
 * Generate a full game board.
 */
export function generateBoard(boardSize = 7, pointCardCount = 8) {
  const board = generateConnectedBoard(boardSize);
  placePointCards(board, boardSize, pointCardCount);
  return board;
}

// ── Pathfinding ──────────────────────────────────────────────────

/**
 * BFS to find all tiles reachable within `maxSteps` from `start`.
 * Returns a Map of "row,col" → { row, col, distance }.
 */
export function getValidMoves(board, startRow, startCol, maxSteps, boardSize) {
  const reachable = new Map();
  const visited = new Set();
  const queue = [{ row: startRow, col: startCol, dist: 0 }];
  visited.add(`${startRow},${startCol}`);

  while (queue.length > 0) {
    const { row, col, dist } = queue.shift();

    if (dist > 0) {
      reachable.set(`${row},${col}`, { row, col, distance: dist });
    }

    if (dist >= maxSteps) continue;

    const tile = board[row][col];
    for (const dir of tile.directions) {
      const [dr, dc] = DELTA[dir];
      const nr = row + dr;
      const nc = col + dc;
      const key = `${nr},${nc}`;

      if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
      if (visited.has(key)) continue;

      // Check mutual connection
      if (board[nr][nc].directions.includes(OPPOSITE[dir])) {
        visited.add(key);
        queue.push({ row: nr, col: nc, dist: dist + 1 });
      }
    }
  }

  return reachable;
}

/**
 * Find shortest path from (sr, sc) to (tr, tc) using BFS.
 * Returns array of {row, col} or null if unreachable.
 */
export function findPath(board, sr, sc, tr, tc, maxSteps, boardSize) {
  if (sr === tr && sc === tc) return [];

  const visited = new Set();
  const queue = [{ row: sr, col: sc, dist: 0, path: [] }];
  visited.add(`${sr},${sc}`);

  while (queue.length > 0) {
    const { row, col, dist, path } = queue.shift();
    if (dist >= maxSteps) continue;

    const tile = board[row][col];
    for (const dir of tile.directions) {
      const [dr, dc] = DELTA[dir];
      const nr = row + dr;
      const nc = col + dc;
      const key = `${nr},${nc}`;

      if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
      if (visited.has(key)) continue;

      if (board[nr][nc].directions.includes(OPPOSITE[dir])) {
        const newPath = [...path, { row: nr, col: nc }];
        if (nr === tr && nc === tc) return newPath;
        visited.add(key);
        queue.push({ row: nr, col: nc, dist: dist + 1, path: newPath });
      }
    }
  }

  return null;
}

// ── Game State ───────────────────────────────────────────────────

const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#76EB6A',  // Green 
  '#FFE66D', // Yellow
  '#A78BFA', // Purple
  '#FB923C', // Orange
  '#e361dcff'  // Pink
];

export class GameState {
  constructor(boardSize = 7) {
    this.boardSize = boardSize;
    this.pointCardCount = this.getPointCardCount(boardSize);
    this.board = generateBoard(this.boardSize, this.pointCardCount);
    this.players = [];
    this.currentPlayerIndex = 0;
    this.diceResult = null;
    this.stepsRemaining = 0;
    this.pointCardsRemaining = this.pointCardCount;
    this.phase = 'waiting'; // waiting, selecting-start, playing, ended
    this.hostId = null;
  }

  getPointCardCount(size) {
    if (size <= 7) return 7;
    if (size === 8) return 9;
    if (size === 9) return 12;
    return 16; // 10x10
  }

  addPlayer(id, name) {
    if (this.players.length >= 6) return null;
    const color = PLAYER_COLORS[this.players.length];
    const player = {
      id,
      name,
      color,
      score: 0,
      position: null, // { row, col, subPos }
      connected: true,
    };
    this.players.push(player);
    if (this.players.length === 1) this.hostId = id;
    return player;
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx === -1) return;
    if (this.phase === 'waiting') {
      // In lobby, actually remove the player from the array (free the seat)
      this.players.splice(idx, 1);
      // If host left, assign new host
      if (id === this.hostId && this.players.length > 0) {
        this.hostId = this.players[0].id;
      }
    } else {
      // In-game, just mark as disconnected
      this.players[idx].connected = false;
      // If all disconnected, game over
      if (this.players.every(p => !p.connected)) {
        this.phase = 'ended';
      }
      // If it was the current player's turn, advance
      if (this.phase === 'playing' && this.currentPlayerIndex === idx) {
        this.advanceTurn();
      }
    }
  }

  startGame() {
    this.board = generateBoard(this.boardSize, this.pointCardCount);
    this.phase = 'selecting-start';
    this.currentPlayerIndex = 0;
  }

  /**
   * Player selects a border tile to start on.
   */
  selectStartTile(playerId, row, col) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    // Validate it's a border tile
    if (row !== 0 && row !== this.boardSize - 1 && col !== 0 && col !== this.boardSize - 1) {
      return { error: 'Must select a border tile' };
    }

    // Check not already taken
    if (this.players.some(p => p.position && p.position.row === row && p.position.col === col)) {
      return { error: 'Tile already taken' };
    }

    player.position = { row, col, subPos: 'center' };

    // Reveal the tile
    this.board[row][col].revealed = true;

    // Check if all players have selected
    const allSelected = this.players.filter(p => p.connected).every(p => p.position !== null);
    if (allSelected) {
      this.phase = 'playing';
      this.currentPlayerIndex = 0;
    } else {
      // Move to next player who hasn't selected
      for (let i = 0; i < this.players.length; i++) {
        const nextIdx = (this.currentPlayerIndex + 1 + i) % this.players.length;
        const nextPlayer = this.players[nextIdx];
        if (nextPlayer.connected && nextPlayer.position === null) {
          this.currentPlayerIndex = nextIdx;
          break;
        }
      }
    }

    return { success: true };
  }

  rollDice() {
    this.diceResult = Math.floor(Math.random() * 6) + 1;
    this.stepsRemaining = this.diceResult;
    this.hasMovedThisTurn = false;
    return this.diceResult;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get valid tiles the player can explicitly reveal.
   */
  getValidReveals() {
    const player = this.getCurrentPlayer();
    if (!player || !player.position || this.stepsRemaining <= 0) return [];

    const { row, col, subPos } = player.position;
    if (subPos === 'center') return [];
    
    // If there is an active point reveal, force the player to click it
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c].pointRevealed && !this.board[r][c].revealed) {
          return [{ row: r, col: c }];
        }
      }
    }

    // Check tile facing the edge subPos
    const [dr, dc] = DELTA[subPos];
    const nr = row + dr;
    const nc = col + dc;

    if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
      const neighbor = this.board[nr][nc];
      if (!neighbor.revealed) {
         return [{ row: nr, col: nc }];
      }
    }
    return [];
  }

  /**
   * Reveal an adjacent hidden tile.
   */
  revealTile(targetRow, targetCol) {
    const player = this.getCurrentPlayer();
    if (!player || !player.position || this.stepsRemaining <= 0) return { error: 'Cannot reveal right now' };

    const validReveals = this.getValidReveals();
    const isValid = validReveals.some(r => r.row === targetRow && r.col === targetCol);
    if (!isValid) return { error: 'Invalid reveal target' };

    const tile = this.board[targetRow][targetCol];
    if (tile.revealed) return { error: 'Tile already revealed' };

    const events = [];

    // Stage 1: If it's a point card and we haven't shown its point yet
    if (tile.type === 'point' && !tile.pointRevealed) {
      tile.pointRevealed = true;
      events.push({ type: 'reveal-point', row: targetRow, col: targetCol, points: tile.points });
      return { events };
    }

    // Stage 2: Fully reveal the tile
    tile.revealed = true;
    events.push({ type: 'reveal', row: targetRow, col: targetCol });

    // Handle point card scoring
    if (tile.type === 'point') {
      player.score += tile.points;
      this.pointCardsRemaining--;
      events.push({
        type: 'score',
        row: targetRow,
        col: targetCol,
        points: tile.points,
        playerName: player.name,
        newScore: player.score,
      });
      tile.type = 'path';
      tile.points = null;
    }

    // Check game end
    if (this.pointCardsRemaining <= 0) {
      this.phase = 'ended';
      events.push({ type: 'game-end', winner: this.getWinner() });
    }

    return { events };
  }

  /**
   * Get valid sub-position moves for the current player.
   * Returns array of { row, col, subPos } targets.
   */
  getValidSubMoves() {
    const player = this.getCurrentPlayer();
    if (!player || !player.position || this.stepsRemaining <= 0) return [];

    const { row, col, subPos } = player.position;
    const tile = this.board[row][col];
    const moves = [];

    // Disallow movement if there is an active point-reveal pending
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c].pointRevealed && !this.board[r][c].revealed) {
          return [];
        }
      }
    }

    if (subPos === 'center') {
      // From center: can move to any edge direction this tile connects to
      for (const dir of tile.directions) {
        moves.push({ row, col, subPos: dir });
      }
    } else {
      // At an edge sub-position
      // Option 1: go back to center of same tile
      moves.push({ row, col, subPos: 'center' });

      // Option 2: cross to adjacent tile's opposite edge
      const [dr, dc] = DELTA[subPos];
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
        const neighbor = this.board[nr][nc];
        // Check mutual connection (server knows all connections)
        // AND card must be revealed to be able to move into it
        if (neighbor.revealed && neighbor.directions.includes(OPPOSITE[subPos])) {
          moves.push({ row: nr, col: nc, subPos: OPPOSITE[subPos] });
        }
      }
    }

    if (player.lastPosition) {
      return moves.filter(
        m => !(m.row === player.lastPosition.row && m.col === player.lastPosition.col && m.subPos === player.lastPosition.subPos)
      );
    }

    return moves;
  }

  /**
   * Move current player to a target sub-position. Returns result with events.
   */
  movePlayer(targetRow, targetCol, targetSubPos) {
    const player = this.getCurrentPlayer();
    if (!player || !player.position) return { error: 'No player' };

    let validMoves = this.getValidSubMoves();
    let isValid = validMoves.some(
      m => m.row === targetRow && m.col === targetCol && m.subPos === targetSubPos
    );
    if (!isValid) return { error: 'Invalid move' };

    const events = [];

    // Execute first move
    player.lastPosition = { row: player.position.row, col: player.position.col, subPos: player.position.subPos };
    player.position = { row: targetRow, col: targetCol, subPos: targetSubPos };
    this.stepsRemaining -= 1;
    this.hasMovedThisTurn = true;

    events.push({
      type: 'move',
      playerId: player.id,
      to: { row: targetRow, col: targetCol, subPos: targetSubPos },
      stepsRemaining: this.stepsRemaining,
      auto: false,
    });

    // Auto-move loop
    while (this.stepsRemaining > 0) {
      validMoves = this.getValidSubMoves();
      
      // Auto-move only if there is exactly 1 valid move
      if (validMoves.length !== 1) break;

      const nextMove = validMoves[0];
      
      // Update position
      player.lastPosition = { row: player.position.row, col: player.position.col, subPos: player.position.subPos };
      player.position = { row: nextMove.row, col: nextMove.col, subPos: nextMove.subPos };
      this.stepsRemaining -= 1;

      events.push({
        type: 'move',
        playerId: player.id,
        to: { row: nextMove.row, col: nextMove.col, subPos: nextMove.subPos },
        stepsRemaining: this.stepsRemaining,
        auto: true,
      });

      // Break if game ended (e.g. all cards scavenged, though rare during a move itself)
      if (this.phase === 'ended') break;
    }

    // Check game end
    if (this.pointCardsRemaining <= 0) {
      this.phase = 'ended';
      events.push({ type: 'game-end', winner: this.getWinner() });
    } else if (this.stepsRemaining === 0) {
      // Auto-end turn if no steps left
      const endResult = this.endTurn();
      if (!endResult.error) {
        events.push(...endResult.events);
      }
    }

    return { events, stepsRemaining: this.stepsRemaining };
  }

  endTurn() {
    // Check if there is an active point reveal pending
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c].pointRevealed && !this.board[r][c].revealed) {
          return { error: 'You must reveal the pending point card before ending your turn.' };
        }
      }
    }

    this.diceResult = null;
    this.stepsRemaining = 0;
    const p = this.getCurrentPlayer();
    if (p) p.lastPosition = null;
    
    this.advanceTurn();
    return { success: true, events: [] };
  }

  advanceTurn() {
    const connectedPlayers = this.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
      this.phase = 'ended';
      return;
    }

    let attempts = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      attempts++;
    } while (!this.players[this.currentPlayerIndex].connected && attempts < this.players.length);
  }

  getWinner() {
    let maxScore = -Infinity;
    let winner = null;
    for (const player of this.players) {
      if (player.score > maxScore) {
        maxScore = player.score;
        winner = player;
      }
    }
    return winner;
  }

  /**
   * Serialize state for sending to clients.
   * Hides point card values for unrevealed tiles.
   */
  toClientState(playerId) {
    const boardForClient = this.board
      ? this.board.map(row =>
          row.map(tile => ({
            type: tile.revealed ? tile.type : 'hidden',
            directions: tile.revealed ? tile.directions : [],
            points: (tile.revealed || tile.pointRevealed) && tile.type === 'point' ? tile.points : null,
            revealed: tile.revealed,
            pointRevealed: tile.pointRevealed,
            isPointCard: !tile.revealed && tile.type === 'point',
            row: tile.row,
            col: tile.col,
          }))
        )
      : null;

    // Compute valid sub-moves and reveals for the current player
    const currentPlayer = this.getCurrentPlayer();
    const isCurrentPlayer = currentPlayer?.id === playerId;
    
    const validSubMoves = (isCurrentPlayer && this.stepsRemaining > 0)
      ? this.getValidSubMoves()
      : [];
      
    const validReveals = (isCurrentPlayer && this.stepsRemaining > 0)
      ? this.getValidReveals()
      : [];

    return {
      board: boardForClient,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        position: p.position,
        connected: p.connected,
        isYou: p.id === playerId,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer()?.id,
      diceResult: this.diceResult,
      stepsRemaining: this.stepsRemaining,
      boardSize: this.boardSize,
      pointCardsRemaining: this.pointCardsRemaining,
      totalPointCards: this.pointCardCount,
      phase: this.phase,
      hostId: this.hostId,
      validSubMoves,
      validReveals,
    };
  }
}

export const BOARD_SIZE_EXPORT = BOARD_SIZE;
