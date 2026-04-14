# dice-luck-party

## Game Instructions

Dice Luck Party is a multiplayer, turn-based board game for 1-4 players. Players take turns rolling dice, moving across a hidden 7x7 board, revealing tiles, and collecting points. The player with the highest score at the end wins.

### How to Play
1. **Join or create a room** (up to 4 players).
2. **Take turns** rolling the dice and move.
3. **Reveal tiles** as you move. Tiles may be:
   - **Path cards**: Allow movement in certain directions.
   - **Point cards**: Award or deduct points.
4. **Collect points** by landing on point cards.
5. **Game ends** when all point cards are revealed or a win condition is met.
6. **Highest score wins!**

## Tech Stack

### Frontend
- Vite
- Vanilla JavaScript (ES Modules)
- HTML/CSS
- Socket.IO Client

### Backend
- Node.js
- Express
- Socket.IO
- Custom game logic (see `server/game-logic.js`)

## Local Development Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the development server:**
   ```sh
   npm run dev:host
   ```
   - This runs both the Vite frontend and the Node.js backend with Socket.IO.
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

3. **Open your browser** and go to http://localhost:5173 to play locally.

---

For more details, see the [docs/SPEC.md](docs/SPEC.md).
