"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GameOver({ state, onPlayAgain }) {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣"];

  return (
    <Card className="text-center max-w-[500px] w-full" id="game-over">
      <h2 className="text-4xl font-black mb-2 bg-gradient-to-br from-accent-yellow to-accent-teal bg-clip-text text-transparent">
        🎉 Congratulations!
      </h2>
      <div className="text-xl text-accent-yellow font-bold mb-6">
        {winner.name} wins!
      </div>

      <ul className="flex flex-col gap-2.5 mb-7 list-none p-0">
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 px-4 py-3.5 bg-card rounded-[12px] border ${
              i === 0
                ? "border-accent-yellow bg-accent-yellow/5"
                : "border-border-glass"
            }`}
          >
            <span className="text-2xl font-black w-10">{medals[i] || ""}</span>
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{
                background: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
            <span className="flex-1 font-semibold text-left">
              {p.name}
              {p.isYou ? " (you)" : ""}
            </span>
            <span className="text-xl font-extrabold" style={{ color: p.color }}>
              {p.score}
            </span>
          </li>
        ))}
      </ul>

      <Button onClick={onPlayAgain} id="play-again-btn">
        🔁 Play Again
      </Button>
    </Card>
  );
}
