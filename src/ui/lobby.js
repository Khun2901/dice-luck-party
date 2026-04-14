// ── Lobby Screen ─────────────────────────────────────────────
export function renderLobby(onCreateRoom, onJoinRoom) {
  const el = document.createElement('div');
  el.className = 'glass-panel lobby';
  el.innerHTML = `
    <h1 class="lobby-title">🎲 Dice Luck Party</h1>
    <p class="lobby-subtitle">Roll, reveal, and race to victory!</p>
    <p class="lobby-subtitle-small">(Inspired from "Card Party: Mario Party 5")</p>
    <div class="lobby-actions" style="margin-bottom: 40px;">
      <input type="text" class="input" id="player-name" placeholder="Enter your name..." maxlength="16" />
      
      <div class="lobby-options" style="margin: 15px 0; display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Board Size</label>
        <div class="size-selector" style="display: flex; gap: 8px; justify-content: center;">
          <button class="btn btn-secondary size-btn active" data-size="7">7x7</button>
          <button class="btn btn-secondary size-btn" data-size="8">8x8</button>
          <button class="btn btn-secondary size-btn" data-size="9">9x9</button>
          <button class="btn btn-secondary size-btn" data-size="10">10x10</button>
        </div>
      </div>

      <button class="btn btn-primary" id="create-room-btn">✨ Create Room</button>
      <div class="lobby-divider"><span>or join a room</span></div>
      <div class="lobby-input-group">
        <input type="text" class="input room-code-input" id="room-code" placeholder="CODE" maxlength="4" />
        <button class="btn btn-secondary" id="join-room-btn">Join</button>
      </div>
    </div>

    <div class="lobby-footer">
      <span class="version-tag">version 0.1.0</span>
      <button class="help-btn-inline" id="help-btn" title="How to Play">?</button>
    </div>

    <!-- Tutorial Modal -->
    <div id="tutorial-modal" class="modal hidden">
      <div class="modal-content">
        <button class="close-btn" id="close-tutorial">✖</button>
        
        <div class="tutorial-steps">
          <div class="tutorial-step active">
            <h3>1. Choose Starting Area</h3>
            <img src="/images/step1.png?v=2" alt="Select start tile">
            <p>Click any lit-up border tile on the map to drop your player token onto the board and begin your journey!</p>
          </div>
          <div class="tutorial-step hidden">
            <h3>2. Roll the Dice</h3>
            <img src="/images/step2.png?v=2" alt="Dice roll">
            <p>When it is your turn, roll the dice to determine your movement steps. Plan your route carefully!</p>
          </div>
          <div class="tutorial-step hidden">
            <h3>3. Move Your Token</h3>
            <img src="/images/step3.png?v=2" alt="Move token">
            <p>Click the fully opaque white dots along the path to move. Every sub-position dot costs precisely 1 step of your roll!</p>
          </div>
          <div class="tutorial-step hidden">
            <h3>4. Reveal Point Cards</h3>
            <img src="/images/step4.png?v=2" alt="Reveal point cards">
            <p>Click hidden point cards to reveal their neon score! You must double-click it to score those points.</p>
          </div>
          <div class="tutorial-step hidden">
            <h3>5. Win the Game!</h3>
            <img src="/images/step5.png?v=2" alt="Game over screen">
            <p>Gather the most points before all 8 point cards are scavenged and the board is emptied. Good luck!</p>
          </div>
        </div>

        <div class="tutorial-controls">
          <button class="btn btn-secondary" id="tut-prev" disabled>◀ Prev</button>
          <span id="tut-page" style="color:var(--text-secondary);font-weight:bold;">1 / 5</span>
          <button class="btn btn-primary" id="tut-next">Next ▶</button>
        </div>
      </div>
    </div>
  `;

  // Auto-focus name input
  setTimeout(() => el.querySelector('#player-name')?.focus(), 100);

  let selectedSize = 7;
  const sizeBtns = el.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = Number(btn.dataset.size);
    });
  });

  el.querySelector('#create-room-btn').addEventListener('click', () => {
    const name = el.querySelector('#player-name').value.trim();
    if (!name) {
      el.querySelector('#player-name').style.borderColor = 'var(--accent-1)';
      el.querySelector('#player-name').focus();
      return;
    }
    onCreateRoom(name, selectedSize);
  });

  el.querySelector('#join-room-btn').addEventListener('click', () => {
    const name = el.querySelector('#player-name').value.trim();
    const code = el.querySelector('#room-code').value.trim().toUpperCase();
    if (!name) {
      el.querySelector('#player-name').style.borderColor = 'var(--accent-1)';
      el.querySelector('#player-name').focus();
      return;
    }
    if (!code || code.length < 4) {
      el.querySelector('#room-code').style.borderColor = 'var(--accent-1)';
      el.querySelector('#room-code').focus();
      return;
    }
    onJoinRoom(name, code);
  });

  // Allow Enter key
  el.querySelector('#player-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.querySelector('#create-room-btn').click();
  });

  el.querySelector('#room-code').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.querySelector('#join-room-btn').click();
  });

  // Tutorial Modal Logic
  const modal = el.querySelector('#tutorial-modal');
  const steps = el.querySelectorAll('.tutorial-step');
  const prevBtn = el.querySelector('#tut-prev');
  const nextBtn = el.querySelector('#tut-next');
  const pageText = el.querySelector('#tut-page');
  let currentStep = 0;

  function updateModal() {
    steps.forEach((s, i) => {
      if (i === currentStep) s.classList.remove('hidden');
      else s.classList.add('hidden');
    });
    prevBtn.disabled = currentStep === 0;
    nextBtn.disabled = currentStep === steps.length - 1;
    pageText.textContent = `${currentStep + 1} / ${steps.length}`;
  }

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) currentStep--;
    updateModal();
  });

  nextBtn.addEventListener('click', () => {
    if (currentStep < steps.length - 1) currentStep++;
    updateModal();
  });

  el.querySelector('#help-btn').addEventListener('click', () => {
    currentStep = 0;
    updateModal();
    modal.classList.remove('hidden');
  });

  el.querySelector('#close-tutorial').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  return el;
}
