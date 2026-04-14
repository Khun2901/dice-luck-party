# 🎮 Party Board Game – Requirements Specification

## 1. Overview
A multiplayer turn-based board game for up to 4 players. Players move across a hidden board, reveal tiles, and collect points. The player with the highest score at the end wins.

---

## 2. Game Rules

### 2.1 Players
- Minimum: 1 player
- Maximum: 4 players
- Each player takes turns sequentially

---

## 3. Board System

### 3.1 Board Structure
- The board is a **7x7 grid**
- Each tile is a **card**
- Cards are **hidden at the start**
- Cards are revealed when a player steps on them

---

### 3.2 Card Types

#### 1. Path Cards
- Allow player movement
- Always contain a **center connection**
- May connect to:
  - Top
  - Bottom
  - Left
  - Right
- Must have **at least 2 connected directions**

#### 2. Point Cards
- Hidden among the board
- Total: **12 cards**
- Types:
  - `+1`
  - `+2`
  - `-1`
- Revealed when player steps on them
- After being revealed → **converted into a Path Card**

---

## 4. Path Card Constraints

### 4.1 Connectivity Rules
- Each path card must:
  - Always include the **center**
  - Connect to **at least 2 directions**

Example:



---

### 4.2 Border Rules
- Cards at the edge of the board must NOT connect outside the board

Examples:
- Top row → no "top" connection
- Bottom row → no "bottom" connection
- Left column → no "left" connection
- Right column → no "right" connection

Example:
- Top-left corner:
  - ❌ no top
  - ❌ no left

---

## 5. Board Generation

- The board is generated **randomly at game start**
- All path cards must:
  - Follow connectivity rules
  - Form a **valid connected path system**
- Point cards:
  - Must be randomly distributed
  - Must NOT be placed on border tiles

---

## 6. Game Start

- Before the game begins:
  - Each player selects a **starting tile on the border**
- Players start at:
  - The **center of the chosen tile**

---

## 7. Gameplay Mechanics

### 7.1 Turn-Based System
- Players take turns in order

---

### 7.2 Dice Roll Movement
- At the start of each turn:
  - The player rolls a **dice (1–6)**
- The dice result determines:
  - The **maximum number of steps** the player can move in that turn

---

### 7.3 Movement Rules

- Players move step-by-step across tiles
- Each step must:
  - Follow valid **path connections**
  - Move only in:
    - Up / Down / Left / Right

#### Constraints:
- A move is valid only if:
  - Current tile connects to the target tile
  - Target tile connects back to current tile

---

### 7.4 Movement Execution

- A player may:
  - Choose their path freely (branching allowed)
  - Stop before using all dice steps (optional, depending on design choice)

- If no valid moves are available:
  - The player’s turn ends immediately

---

### 7.5 Tile Interaction

#### If Path Card:
- Tile is revealed
- Player continues movement (if steps remain)

#### If Point Card:
- Reveal the point value
- Add to player score
- Convert tile into a Path Card
- Player continues movement (if steps remain)

---

## 8. Scoring System

- Players gain or lose points when landing on point cards:
  - `+1`
  - `+2`
  - `-1`

---

## 9. Game End Condition

The game ends when:
- All **12 point cards have been revealed**

---

## 10. Winning Condition

- The player with the **highest total score** wins

---

## 11. Additional Notes (Optional Enhancements)

- Timer per turn
- Skip turn if no valid moves
- Reconnection handling for multiplayer
- Visual indicators for revealed tiles
- Animation for dice rolling
