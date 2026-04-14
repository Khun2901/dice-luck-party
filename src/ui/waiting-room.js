// ── Waiting Room Screen ──────────────────────────────────────
export function renderWaitingRoom(roomCode, players, hostId, myId, isHost, onStart, onLeave) {
  const el = document.createElement('div');
  el.className = 'glass-panel waiting-room';

  const maxPlayers = 4;
  const slots = [];
  for (let i = 0; i < maxPlayers; i++) {
    if (i < players.length) {
      const p = players[i];
      const tags = [];
      if (p.id === hostId) tags.push('<span class="player-tag host">Host</span>');
      if (p.id === myId) tags.push('<span class="player-tag you">You</span>');
      const disconnectStyle = p.connected ? '' : 'opacity: 0.4;';
      slots.push(`
        <li class="player-item" style="${disconnectStyle}">
          <span class="player-dot" style="background: ${p.color}; color: ${p.color};"></span>
          <span class="player-name">${p.name}${!p.connected ? ' (disconnected)' : ''}</span>
          ${tags.join('')}
        </li>
      `);
    } else {
      slots.push(`
        <li class="player-item empty-slot">
          <span class="player-dot" style="background: rgba(255,255,255,0.1);"></span>
          <span class="player-name">Waiting for player...</span>
        </li>
      `);
    }
  }

  el.innerHTML = `
    <h2>🎮 Game Lobby</h2>
    <div class="room-code-display">
      <div class="room-code-label">Room Code</div>
      <div class="room-code-value">${roomCode}</div>
    </div>
    <ul class="player-list">${slots.join('')}</ul>
    <div class="waiting-actions">
      ${isHost ? `<button class="btn btn-primary" id="start-btn" ${players.length < 1 ? 'disabled' : ''}>🚀 Start Game</button>` : '<p style="color: var(--text-secondary);">Waiting for host to start...</p>'}
      <button class="btn btn-secondary" id="leave-btn">Leave</button>
    </div>
  `;

  if (isHost) {
    el.querySelector('#start-btn')?.addEventListener('click', onStart);
  }
  el.querySelector('#leave-btn').addEventListener('click', onLeave);

  return el;
}
