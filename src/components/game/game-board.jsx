"use client";

import { useMemo } from "react";

const SUB_POS = {
  center: { top: "50%", left: "50%" },
  top: { top: "20%", left: "50%" },
  bottom: { top: "80%", left: "50%" },
  left: { top: "50%", left: "20%" },
  right: { top: "50%", left: "80%" },
};

export default function GameBoard({ state, onTileClick }) {
  const boardSize = state.boardSize ?? state.board?.length ?? 0;
  const currentPlayer =
    state.players && state.players[state.currentPlayerIndex];

  // Build valid sub-move set
  const validSubMoveSet = useMemo(() => {
    const set = new Set();
    if (state.validSubMoves) {
      for (const m of state.validSubMoves) {
        set.add(`${m.row},${m.col},${m.subPos}`);
      }
    }
    return set;
  }, [state.validSubMoves]);

  if (!currentPlayer || !state.board) {
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="px-6 py-3 rounded-[12px] text-center font-semibold animate-pulse text-text-secondary">
          ⌛ Waiting for game state...
        </div>
      </div>
    );
  }

  // Banner text
  let bannerText = "";
  let bannerColor = currentPlayer.color;

  if (state.phase === "selecting-start") {
    bannerText = currentPlayer.isYou
      ? "📍 Select your starting tile (border only)"
      : `⏳ ${currentPlayer.name} is selecting a starting tile...`;
  } else if (state.phase === "playing") {
    if (currentPlayer.isYou) {
      bannerText = !state.diceResult
        ? "🎲 Your turn – Roll the dice!"
        : `🏃 Your turn – ${state.stepsRemaining} step${state.stepsRemaining !== 1 ? "s" : ""} remaining`;
    } else {
      bannerText = `⏳ ${currentPlayer.name}'s turn`;
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Turn Banner */}
      <div
        className="px-6 py-3 rounded-[12px] text-center font-semibold animate-[bannerSlide_0.4s_ease]"
        style={{
          background: `${bannerColor}20`,
          border: `1px solid ${bannerColor}40`,
          color: bannerColor,
        }}
      >
        {bannerText}
      </div>

      {/* Board Grid */}
      <div
        className="board-grid"
        style={{ "--board-size": boardSize }}
      >
        {Array.from({ length: boardSize }).map((_, r) =>
          Array.from({ length: boardSize }).map((_, c) => {
            const tile = state.board[r][c];

            // Determine tile classes
            const isSelectableStart =
              state.phase === "selecting-start" &&
              currentPlayer.isYou &&
              (r === 0 || r === boardSize - 1 || c === 0 || c === boardSize - 1) &&
              !state.players.some(
                (p) => p.position?.row === r && p.position?.col === c
              );

            // Revealable logic
            let isRevealable = false;
            if (
              state.phase === "playing" &&
              currentPlayer.isYou &&
              state.diceResult &&
              state.stepsRemaining > 0 &&
              !tile.revealed &&
              state.validReveals
            ) {
              if (
                currentPlayer.position?.subPos &&
                currentPlayer.position.subPos !== "center"
              ) {
                const deltas = {
                  top: [-1, 0],
                  bottom: [1, 0],
                  left: [0, -1],
                  right: [0, 1],
                };
                const [dr, dc] = deltas[currentPlayer.position.subPos] || [0, 0];
                const expectedRow = currentPlayer.position.row + dr;
                const expectedCol = currentPlayer.position.col + dc;
                isRevealable = state.validReveals.some(
                  (vr) =>
                    vr.row === r &&
                    vr.col === c &&
                    r === expectedRow &&
                    c === expectedCol
                );
              }
            }

            // Players on this tile
            const playersHere = state.players.filter(
              (p) =>
                p.position?.row === r &&
                p.position?.col === c &&
                p.connected
            );

            return (
              <div
                key={`${r}-${c}`}
                className={`tile ${tile.revealed ? "tile-revealed" : "tile-hidden"} ${
                  isSelectableStart ? "tile-selectable border-tile" : ""
                } ${isRevealable ? "tile-revealable" : ""}`}
                data-row={r}
                data-col={c}
                onClick={() => {
                  if (isSelectableStart) {
                    onTileClick(r, c, "center");
                  } else if (isRevealable) {
                    onTileClick(r, c, "reveal");
                  }
                }}
              >
                {/* Revealed tile content */}
                {tile.revealed && (
                  <div className="path-lines">
                    <div className="path-line center" />
                    {tile.directions.map((dir) => (
                      <div key={dir} className={`path-line ${dir}`} />
                    ))}
                  </div>
                )}

                {/* Hidden tile content */}
                {!tile.revealed && (
                  <>
                    {tile.pointRevealed ? (
                      <div
                        className={`tile-point-preview ${
                          tile.points > 0 ? "positive" : "negative"
                        }`}
                      >
                        {tile.points > 0 ? "+" : ""}
                        {tile.points}
                      </div>
                    ) : tile.isPointCard ? (
                      <div className="tile-point-indicator">⭐</div>
                    ) : (
                      <div className="tile-pattern" />
                    )}
                  </>
                )}

                {/* Reveal hint */}
                {isRevealable && !tile.pointRevealed && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-yellow text-sm font-bold text-center pointer-events-none bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm z-10">
                    👁️ Reveal
                  </div>
                )}

                {/* Sub-move dots (on revealed tiles) */}
                {tile.revealed &&
                  ["center", "top", "bottom", "left", "right"].map((sp) => {
                    const isCenter = sp === "center";
                    const isConnectedEdge = tile.directions.includes(sp);
                    if (!isCenter && !isConnectedEdge) return null;

                    const key = `${r},${c},${sp}`;
                    const isValidTarget =
                      state.phase === "playing" &&
                      currentPlayer.isYou &&
                      state.diceResult &&
                      state.stepsRemaining > 0 &&
                      validSubMoveSet.has(key);

                    return (
                      <div
                        key={sp}
                        className={`sub-move-dot always-visible ${
                          isValidTarget ? "is-valid-target" : ""
                        }`}
                        data-subpos={sp}
                        style={{
                          top: SUB_POS[sp].top,
                          left: SUB_POS[sp].left,
                        }}
                        onClick={(e) => {
                          if (isValidTarget) {
                            e.stopPropagation();
                            onTileClick(r, c, sp);
                          }
                        }}
                      />
                    );
                  })}

                {/* Player tokens */}
                {playersHere.map((p) => {
                  const isCurrentTurn =
                    state.players[state.currentPlayerIndex]?.id === p.id;
                  const subPos = p.position?.subPos || "center";
                  return (
                    <div
                      key={p.id}
                      className="player-token-sub"
                      style={{
                        background: p.color,
                        boxShadow: `0 0 10px ${p.color}, 0 0 4px ${p.color}`,
                        zIndex: isCurrentTurn ? 10 : 5,
                        top: SUB_POS[subPos].top,
                        left: SUB_POS[subPos].left,
                      }}
                      title={p.name}
                    />
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
