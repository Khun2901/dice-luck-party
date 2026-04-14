// Sub-position CSS offsets (percentage within tile)

// Sub-position CSS offsets (percentage within tile)
const SUB_POS = {
  center: { top: '50%', left: '50%' },
  top:    { top: '20%', left: '50%' },
  bottom: { top: '80%', left: '50%' },
  left:   { top: '50%', left: '20%' },
  right:  { top: '50%', left: '80%' },
};

/**
 * Render the game board grid with sub-position support.
 */
export function renderBoard(state, onTileClick) {
  const el = document.createElement('div');
  el.className = 'board-area';

  // Status banner
  const banner = document.createElement('div');
  banner.className = 'turn-banner';
  
  const currentPlayer = state.players && state.players[state.currentPlayerIndex];
  if (!currentPlayer || !state.board) {
    banner.textContent = '⌛ Waiting for game state...';
    el.appendChild(banner);
    return el;
  }

  if (state.phase === 'selecting-start') {
    banner.style.background = `${currentPlayer.color}20`;
    banner.style.border = `1px solid ${currentPlayer.color}40`;
    banner.style.color = currentPlayer.color;
    if (currentPlayer.isYou) {
      banner.textContent = '📍 Select your starting tile (border only)';
    } else {
      banner.textContent = `⏳ ${currentPlayer.name} is selecting a starting tile...`;
    }
  } else if (state.phase === 'playing') {
    banner.style.background = `${currentPlayer.color}20`;
    banner.style.border = `1px solid ${currentPlayer.color}40`;
    banner.style.color = currentPlayer.color;
    if (currentPlayer.isYou) {
      if (!state.diceResult) {
        banner.textContent = '🎲 Your turn – Roll the dice!';
      } else {
        banner.textContent = `🏃 Your turn – ${state.stepsRemaining} step${state.stepsRemaining !== 1 ? 's' : ''} remaining`;
      }
    } else {
      banner.textContent = `⏳ ${currentPlayer.name}'s turn`;
    }
  }
  el.appendChild(banner);

  // Board grid
  const grid = document.createElement('div');
  grid.className = 'board-grid';
  const boardSize = state.boardSize ?? state.board?.length ?? 0;
  grid.style.setProperty('--board-size', boardSize);

  // Build a set of valid sub-move targets for quick lookup
  const validSubMoveSet = new Set();
  if (state.validSubMoves) {
    for (const m of state.validSubMoves) {
      validSubMoveSet.add(`${m.row},${m.col},${m.subPos}`);
    }
  }

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const tile = state.board[r][c];
      const tileEl = document.createElement('div');
      tileEl.className = 'tile';
      tileEl.dataset.row = r;
      tileEl.dataset.col = c;

      if (tile.revealed) {
        tileEl.classList.add('tile-revealed');
        // Draw path lines
        const lines = document.createElement('div');
        lines.className = 'path-lines';
        lines.innerHTML = '<div class="path-line center"></div>';
        for (const dir of tile.directions) {
          lines.innerHTML += `<div class="path-line ${dir}"></div>`;
        }
        tileEl.appendChild(lines);
      } else {
        tileEl.classList.add('tile-hidden');
        if (tile.pointRevealed) {
          const sign = tile.points > 0 ? '+' : '';
          const colorClass = tile.points > 0 ? 'positive' : 'negative';
          tileEl.innerHTML = `<div class="tile-point-preview ${colorClass}">${sign}${tile.points}</div>`;
        } else if (tile.isPointCard) {
          tileEl.innerHTML = '<div class="tile-point-indicator">⭐</div>';
        } else {
          tileEl.innerHTML = '<div class="tile-pattern"></div>';
        }
      }

      // Selecting start tile
      if (state.phase === 'selecting-start' && currentPlayer.isYou) {
        const isBorder = r === 0 || r === boardSize - 1 || c === 0 || c === boardSize - 1;
        const isTaken = state.players.some(p => p.position && p.position.row === r && p.position.col === c);
        if (isBorder && !isTaken) {
          tileEl.classList.add('tile-selectable', 'border-tile');
          tileEl.addEventListener('click', () => onTileClick(r, c, 'center'));
        }
      }

      // Valid explicit reveals
      let isRevealable = false;
      if (state.phase === 'playing' && currentPlayer.isYou && state.diceResult && state.stepsRemaining > 0 && !tile.revealed && state.validReveals) {
        // Only show reveal if the player is currently at the correct subpos for this reveal
        if (currentPlayer.position && currentPlayer.position.subPos && currentPlayer.position.subPos !== 'center') {
          // Find the reveal direction for this tile
          const revealDir = currentPlayer.position.subPos;
          // The revealable tile must be in the direction of the player's subpos
          const [dr, dc] = {
            top: [-1, 0],
            bottom: [1, 0],
            left: [0, -1],
            right: [0, 1],
          }[revealDir] || [0, 0];
          const expectedRow = currentPlayer.position.row + dr;
          const expectedCol = currentPlayer.position.col + dc;
          isRevealable = state.validReveals.some(vr => vr.row === r && vr.col === c && r === expectedRow && c === expectedCol);
        } else {
          isRevealable = false;
        }
        if (isRevealable) {
          tileEl.classList.add('tile-revealable');
          tileEl.addEventListener('click', () => onTileClick(r, c, 'reveal'));
          if (!tile.pointRevealed) {
            tileEl.innerHTML += '<div class="reveal-hint">👁️ Reveal</div>';
          }
        }
      }

      // Valid sub-move indicators
      if (tile.revealed) {
        // user requested: "always make the sub-pos appeared when the card was revealed"
        for (const sp of ['center', 'top', 'bottom', 'left', 'right']) {
          const isCenter = sp === 'center';
          const isConnectedEdge = tile.directions.includes(sp);
          if (isCenter || isConnectedEdge) {
            const dot = document.createElement('div');
            dot.className = 'sub-move-dot always-visible';
            dot.dataset.subpos = sp;
            const pos = SUB_POS[sp];
            dot.style.top = pos.top;
            dot.style.left = pos.left;

            // Make it interactive if it's currently a valid move
            const key = `${r},${c},${sp}`;
            if (state.phase === 'playing' && currentPlayer.isYou && state.diceResult && state.stepsRemaining > 0 && validSubMoveSet.has(key)) {
              dot.classList.add('is-valid-target');
              dot.addEventListener('click', (e) => {
                e.stopPropagation();
                onTileClick(r, c, sp);
              });
              tileEl.classList.add('tile-has-valid-sub');
            }
            tileEl.appendChild(dot);
          }
        }
      }

      // Player tokens at their sub-positions
      const playersHere = state.players.filter(
        p => p.position && p.position.row === r && p.position.col === c && p.connected
      );
      if (playersHere.length > 0) {
        for (const p of playersHere) {
          const token = document.createElement('div');
          const isCurrentTurn = state.players[state.currentPlayerIndex]?.id === p.id;
          token.className = 'player-token-sub';
          token.style.background = p.color;
          token.style.boxShadow = `0 0 10px ${p.color}, 0 0 4px ${p.color}`;
          token.style.zIndex = isCurrentTurn ? '10' : '5';
          token.title = p.name;
          const subPos = p.position.subPos || 'center';
          const pos = SUB_POS[subPos];
          token.style.top = pos.top;
          token.style.left = pos.left;
          tileEl.appendChild(token);
        }
      }

      grid.appendChild(tileEl);
    }
  }

  el.appendChild(grid);
  return el;
}
