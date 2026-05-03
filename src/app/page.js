"use client";

import { GameProvider } from "@/context/game-context";
import GameApp from "@/components/game/game-app";

export default function Home() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
