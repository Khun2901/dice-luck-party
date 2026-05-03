"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

const DICE_FACES = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DiceFace({ value }) {
  const positions = DICE_FACES[value] || [];
  return (
    <div className="grid grid-cols-3 grid-rows-3 items-center justify-items-center p-3.5 w-full h-full">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i}>
          {positions.includes(i) && (
            <div className="w-3 h-3 bg-text-primary rounded-full shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Dice({ state, onRoll }) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(null);
  const intervalRef = useRef(null);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer?.isYou;
  const hasRolled = state.diceResult !== null;

  const handleRoll = useCallback(() => {
    setIsRolling(true);
    intervalRef.current = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 50);
    setTimeout(() => {
      clearInterval(intervalRef.current);
      setIsRolling(false);
      setDisplayValue(null);
      onRoll();
    }, 600);
  }, [onRoll]);

  const shownValue = displayValue || state.diceResult;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20" style={{ perspective: "300px" }}>
        <div className={`w-20 h-20 bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] border-2 border-white/15 rounded-2xl flex items-center justify-center text-4xl font-black text-text-primary shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 ${isRolling ? "dice-rolling" : ""}`}>
          {shownValue ? <DiceFace value={shownValue} /> : <span className="text-text-muted">?</span>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {state.phase === "playing" && isMyTurn && !hasRolled && (
          <Button onClick={handleRoll} disabled={isRolling} id="roll-dice-btn">
            🎲 Roll Dice
          </Button>
        )}
      </div>
    </div>
  );
}
