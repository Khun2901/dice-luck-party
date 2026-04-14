// ── Dice Component ───────────────────────────────────────────
const DICE_FACES = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function createDiceFace(value) {
  const dotsGrid = document.createElement('div');
  dotsGrid.className = 'dice-dots';
  dotsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  dotsGrid.style.gridTemplateRows = 'repeat(3, 1fr)';
  dotsGrid.style.alignItems = 'center';
  dotsGrid.style.justifyItems = 'center';

  const positions = DICE_FACES[value] || [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    if (positions.includes(i)) {
      cell.className = 'dice-dot';
    }
    dotsGrid.appendChild(cell);
  }
  return dotsGrid;
}

export function renderDice(state, onRoll, onEndTurn) {
  const el = document.createElement('div');
  el.className = 'dice-area';

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer?.isYou;
  const hasRolled = state.diceResult !== null;

  // Dice visual
  const diceContainer = document.createElement('div');
  diceContainer.className = 'dice-container';

  const dice = document.createElement('div');
  dice.className = 'dice';

  if (hasRolled) {
    dice.appendChild(createDiceFace(state.diceResult));
  } else {
    dice.textContent = '?';
    dice.style.color = 'var(--text-muted)';
  }

  diceContainer.appendChild(dice);
  el.appendChild(diceContainer);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'dice-actions';

  if (state.phase === 'playing' && isMyTurn && !hasRolled) {
    const rollBtn = document.createElement('button');
    rollBtn.className = 'btn btn-primary';
    rollBtn.textContent = '🎲 Roll Dice';
    rollBtn.addEventListener('click', () => {
      dice.classList.add('rolling');
      dice.style.color = 'inherit'; // override the '?' gray color
      
      const shuffleInterval = setInterval(() => {
        const randVal = Math.floor(Math.random() * 6) + 1;
        dice.innerHTML = '';
        dice.appendChild(createDiceFace(randVal));
      }, 50);

      setTimeout(() => {
        clearInterval(shuffleInterval);
        onRoll();
      }, 600);
    });
    actions.appendChild(rollBtn);
  }

  // Note: End Turn button was removed as turn ending is now automatic after spending all steps.

  el.appendChild(actions);
  return el;
}
