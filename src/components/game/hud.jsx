"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const POINT_CARD_TOTALS = { 7: 7, 8: 9, 9: 12, 10: 16 };

export default function HUD({ state }) {
  const totalPointCards = state.totalPointCards ?? POINT_CARD_TOTALS[state.boardSize] ?? 7;

  return (
    <Card className="p-5" id="hud-panel">
      <div className="text-xs uppercase tracking-[2px] text-text-muted mb-3">Players</div>
      {state.players.map((p, i) => {
        const isActive = i === state.currentPlayerIndex && state.phase === "playing";
        return (
          <div
            key={p.id}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] mb-2 border transition-all ${
              isActive ? "bg-white/5 border-border-glass" : "border-transparent"
            }`}
            style={{ opacity: p.connected ? 1 : 0.4 }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: p.color,
                boxShadow: isActive ? `0 0 10px ${p.color}` : "none",
              }}
            />
            <div className="font-semibold text-sm flex-1">
              {p.name}
              {p.isYou && <small className="text-accent-purple ml-1">(you)</small>}
              {!p.connected && <small className="text-accent-red ml-1">⚡</small>}
            </div>
            <div className="font-bold text-lg" style={{ color: p.color }}>{p.score}</div>
          </div>
        );
      })}

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">🃏 Cards Left</span>
          <span className="font-bold text-accent-teal">
            {state.pointCardsRemaining} / {totalPointCards}
          </span>
        </div>
        {state.diceResult && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">🎲 Dice</span>
              <span className="font-bold text-accent-teal">{state.diceResult}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">👟 Steps Left</span>
              <span className="font-bold text-accent-teal">{state.stepsRemaining}</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
