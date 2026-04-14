// ── HUD (Heads-Up Display) ───────────────────────────────────
export function renderHUD(state) {
  const el = document.createElement('div');
  el.className = 'glass-panel hud-panel';

  const pointCardTotals = {
    7: 7,
    8: 9,
    9: 12,
    10: 16,
  };
  const totalPointCards = state.totalPointCards ?? pointCardTotals[state.boardSize] ?? 7;

  const playersHTML = state.players
    .map((p, i) => {
      const isActive = i === state.currentPlayerIndex && state.phase === 'playing';
      return `
      <div class="hud-player-card ${isActive ? 'active' : ''}" style="${!p.connected ? 'opacity:0.4' : ''}">
        <div class="hud-player-dot" style="background: ${p.color}; box-shadow: ${isActive ? `0 0 10px ${p.color}` : 'none'};"></div>
        <div class="hud-player-name">
          ${p.name}${p.isYou ? ' <small style="color:var(--accent-4)">(you)</small>' : ''}
          ${!p.connected ? ' <small style="color:var(--accent-1)">⚡</small>' : ''}
        </div>
        <div class="hud-player-score" style="color: ${p.color};">${p.score}</div>
      </div>
    `;
    })
    .join('');

  el.innerHTML = `
    <div class="hud-title">Players</div>
    ${playersHTML}
    <div class="hud-info">
      <div class="hud-info-row">
        <span class="hud-info-label">🃏 Cards Left</span>
        <span class="hud-info-value">${state.pointCardsRemaining} / ${totalPointCards}</span>
      </div>
      ${state.diceResult ? `
      <div class="hud-info-row">
        <span class="hud-info-label">🎲 Dice</span>
        <span class="hud-info-value">${state.diceResult}</span>
      </div>
      <div class="hud-info-row">
        <span class="hud-info-label">👟 Steps Left</span>
        <span class="hud-info-value">${state.stepsRemaining}</span>
      </div>
      ` : ''}
    </div>
  `;

  return el;
}
