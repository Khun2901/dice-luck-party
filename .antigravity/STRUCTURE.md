# 🎲 Dice Luck Party — Project Structure

> A multiplayer turn-based party board game built with **Next.js 15**, **ShadCN UI**, **TailwindCSS v4**, and **Socket.IO**.

---

## Root Directory

```
dice-luck-party/
├── .antigravity/          # Project metadata & documentation
├── .env.local             # Environment variables (local dev)
├── docs/                  # Game design documentation
├── public/                # Static assets served by Next.js
├── server/                # Socket.IO game server (deployed separately)
├── src/                   # Next.js application source code
├── .gitignore
├── eslint.config.mjs      # ESLint flat config for Next.js
├── jsconfig.json          # JavaScript path aliases (@/ → src/)
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies and scripts
└── postcss.config.mjs     # PostCSS config for TailwindCSS v4
```

---

## `/src` — Application Source

```
src/
├── app/                   # Next.js App Router (pages & layouts)
│   ├── globals.css        # Tailwind imports + custom game CSS (board grid, tiles, animations)
│   ├── layout.js          # Root layout (Outfit font, metadata, Sonner toast provider)
│   └── page.js            # Home page — renders GameProvider + GameApp
│
├── components/
│   ├── game/              # Game-specific React components
│   │   ├── game-app.jsx       # Main orchestrator — switches between lobby/waiting/game/gameover screens
│   │   ├── lobby.jsx          # Room creation & join UI with tutorial dialog
│   │   ├── waiting-room.jsx   # Player list, room code display, start/leave actions
│   │   ├── game-board.jsx     # 7-10×7-10 tile grid with path lines, sub-move dots, player tokens
│   │   ├── dice.jsx           # Dice visual with roll animation
│   │   ├── hud.jsx            # Heads-up display showing player scores, cards left, steps
│   │   └── game-over.jsx      # Final scoreboard with medals and play-again button
│   │
│   └── ui/                # ShadCN-style reusable UI primitives
│       ├── badge.jsx          # Status labels (Host, You, Warning)
│       ├── button.jsx         # Primary/secondary/danger/ghost button variants
│       ├── card.jsx           # Glassmorphism card container
│       ├── dialog.jsx         # Modal dialog (used for tutorial)
│       ├── input.jsx          # Styled text input
│       └── separator.jsx      # Horizontal/vertical divider line
│
├── context/
│   └── game-context.jsx   # React Context + useReducer for global game state management
│                          # Manages: myId, roomCode, players, gameState, screen transitions
│
├── hooks/
│   └── use-socket.js      # Custom hook for Socket.IO client connection
│                          # Handles: connect/disconnect, room events, game state sync,
│                          # move animations, auto-move logic, event processing
│
└── lib/
    └── utils.js           # Utility functions (cn — Tailwind class merging via clsx + tailwind-merge)
```

---

## `/server` — Socket.IO Game Server

The game server runs as a **standalone Node.js process** separate from the Next.js frontend.  
This architecture supports deployment to Vercel (frontend) + Railway/Render/Fly.io (server).

```
server/
├── server.js              # Express + Socket.IO server
│                          # Room management (create, join, leave, remove player)
│                          # Game event routing (start, select-start, roll, move, reveal, end-turn)
│                          # CORS configuration via CORS_ORIGINS env variable
│
└── game-logic.js          # Pure game state engine (no framework dependency)
                           # Board generation (randomized DFS spanning tree + extra connections)
                           # Pathfinding (BFS for valid moves and shortest path)
                           # Player management, scoring, turn advancement
                           # Point card placement, tile reveal mechanics
                           # Client state serialization (hides unrevealed tile data)
```

---

## `/public` — Static Assets

```
public/
├── favicon.ico            # Browser tab icon
└── images/
    ├── step1.png          # Tutorial screenshot: Choose starting area
    ├── step2.png          # Tutorial screenshot: Roll the dice
    ├── step3.png          # Tutorial screenshot: Move your token
    ├── step4.png          # Tutorial screenshot: Reveal point cards
    └── step5.png          # Tutorial screenshot: Win the game
```

---

## `/docs` — Design Documentation

```
docs/
└── SPEC.md                # Game rules specification
                           # Board structure, card types, movement rules,
                           # scoring system, win conditions
```

---

## Key Architecture Decisions

### Frontend (Next.js + React)
- **App Router** with a single-page client-side app pattern (one `page.js` that handles all screens)
- **ShadCN UI components** (`src/components/ui/`) provide consistent, themeable primitives
- **TailwindCSS v4** for utility-first styling with custom theme tokens matching the dark glassmorphism design
- **React Context** (`game-context.jsx`) replaces global variables for state management
- **Custom hooks** (`use-socket.js`) encapsulate Socket.IO client logic

### Backend (Socket.IO)
- **Separate deployment** — the Socket.IO server runs independently from Next.js
- The server URL is configured via `NEXT_PUBLIC_SOCKET_URL` environment variable
- CORS origins configured via `CORS_ORIGINS` environment variable
- Game logic (`game-logic.js`) is a pure JavaScript module with no framework dependencies

### Deployment Strategy
- **Frontend**: Deploy to Vercel — `npm run build` produces a static Next.js build
- **Server**: Deploy to Railway, Render, or Fly.io — runs `node server/server.js`
- Set `NEXT_PUBLIC_SOCKET_URL` on Vercel to point to the deployed server
- Set `CORS_ORIGINS` on the server to allow the Vercel domain

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both Next.js (port 3000) and Socket.IO server (port 3001) concurrently |
| `npm run dev:client` | Start only the Next.js dev server |
| `npm run dev:server` | Start only the Socket.IO game server |
| `npm run build` | Build the Next.js production bundle |
| `npm run start` | Start the Next.js production server |
| `npm run lint` | Run ESLint |
