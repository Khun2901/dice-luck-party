// ── Waiting Room Screen ──────────────────────────────────────
export function renderWaitingRoom(roomCode, players, hostId, myId, isHost, onStart, onLeave) {
  const el = document.createElement('div');
  el.className = 'glass-panel waiting-room';

  const maxPlayers = 6;
  const slots = [];
  // Always fill player slots from the top, then fill the rest with empty slots
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const tags = [];
    if (p.id === hostId) tags.push('<span class="player-tag host">Host</span>');
    if (p.id === myId) tags.push('<span class="player-tag you">You</span>');
    let removeBtn = '';
    if (isHost && p.id !== hostId) {
      removeBtn = `<button class="remove-player-btn" data-player-id="${p.id}" title="Remove player" style="background:none;border:none;cursor:pointer;padding:0 0 0 8px;"><span style="color:#e53935;font-size:1.3em;vertical-align:middle;">🗑️</span></button>`;
    }
    slots.push(`
      <li class="player-item">
        <span class="player-dot" style="background: ${p.color}; color: ${p.color};"></span>
        <span class="player-name">${p.name}</span>
        ${tags.join('')}
        ${removeBtn}
      </li>
    `);
  }
  for (let i = players.length; i < maxPlayers; i++) {
    slots.push(`
      <li class="player-item empty-slot">
        <span class="player-dot" style="background: rgba(255,255,255,0.1);"></span>
        <span class="player-name">Waiting for player...</span>
      </li>
    `);
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
    // Add event listeners for remove buttons
    el.querySelectorAll('.remove-player-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = btn.getAttribute('data-player-id');
        const confirmRemove = confirm('Remove this player from the room?');
        if (confirmRemove) {
          // Emit a custom event for removal, to be handled in main.js
          el.dispatchEvent(new CustomEvent('remove-player', { detail: { playerId }, bubbles: true }));
        }
      });
    });
  }
  el.querySelector('#leave-btn').addEventListener('click', onLeave);

  return el;
}
