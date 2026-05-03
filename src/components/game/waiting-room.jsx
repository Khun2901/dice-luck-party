"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export default function WaitingRoom({
  roomCode,
  players,
  hostId,
  myId,
  isHost,
  onStart,
  onLeave,
  onRemovePlayer,
}) {
  const maxPlayers = 6;

  return (
    <Card className="text-center max-w-[500px] w-full" id="waiting-room">
      <h2 className="text-2xl font-bold mb-6">🎮 Game Lobby</h2>

      {/* Room Code */}
      <div className="inline-block px-8 py-4 bg-accent-teal/10 border-2 border-dashed border-accent-teal rounded-[12px] mb-7">
        <div className="text-xs text-text-secondary uppercase tracking-[2px] mb-1">
          Room Code
        </div>
        <div className="text-4xl font-black tracking-[8px] text-accent-teal">
          {roomCode}
        </div>
      </div>

      {/* Player List */}
      <ul className="flex flex-col gap-2.5 mb-7 list-none p-0">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 px-4 py-3 bg-card rounded-[12px] border border-border-glass transition-all"
          >
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{
                background: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
            <span className="font-semibold flex-1 text-left">{p.name}</span>
            {p.id === hostId && <Badge variant="host">Host</Badge>}
            {p.id === myId && <Badge variant="you">You</Badge>}
            {isHost && p.id !== hostId && (
              <button
                className="bg-transparent border-none cursor-pointer p-0 pl-2 text-accent-red hover:scale-110 transition-transform"
                title="Remove player"
                onClick={() => {
                  if (confirm("Remove this player from the room?")) {
                    onRemovePlayer(p.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
        {/* Empty slots */}
        {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center gap-3 px-4 py-3 bg-card rounded-[12px] border border-border-glass text-text-muted italic"
          >
            <span className="w-3.5 h-3.5 rounded-full shrink-0 bg-white/10" />
            <span className="font-semibold flex-1 text-left">
              Waiting for player...
            </span>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        {isHost ? (
          <Button
            onClick={onStart}
            disabled={players.length < 1}
            id="start-btn"
          >
            🚀 Start Game
          </Button>
        ) : (
          <p className="text-text-secondary">
            Waiting for host to start...
          </p>
        )}
        <Button variant="secondary" onClick={onLeave} id="leave-btn">
          Leave
        </Button>
      </div>
    </Card>
  );
}
