"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";

const BOARD_SIZES = [7, 8, 9, 10];

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [boardSize, setBoardSize] = useState(7);
  const [nameError, setNameError] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      title: "1. Choose Starting Area",
      image: "/images/step1.png",
      desc: "Click any lit-up border tile on the map to drop your player token onto the board and begin your journey!",
    },
    {
      title: "2. Roll the Dice",
      image: "/images/step2.png",
      desc: "When it is your turn, roll the dice to determine your movement steps. Plan your route carefully!",
    },
    {
      title: "3. Move Your Token",
      image: "/images/step3.png",
      desc: "Click the fully opaque white dots along the path to move. Every sub-position dot costs precisely 1 step of your roll!",
    },
    {
      title: "4. Reveal Point Cards",
      image: "/images/step4.png",
      desc: "Click hidden point cards to reveal their neon score! You must double-click it to score those points.",
    },
    {
      title: "5. Win the Game!",
      image: "/images/step5.png",
      desc: "Gather the most points before all point cards are scavenged and the board is emptied. Good luck!",
    },
  ];

  const handleCreate = () => {
    if (!playerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onCreateRoom(playerName.trim(), boardSize);
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setNameError(true);
      return;
    }
    if (!roomCode.trim() || roomCode.length < 4) {
      setCodeError(true);
      return;
    }
    setNameError(false);
    setCodeError(false);
    onJoinRoom(playerName.trim(), roomCode.toUpperCase());
  };

  return (
    <Card className="text-center max-w-[480px] w-full relative" id="lobby-panel">
      {/* Title */}
      <h1 className="text-5xl font-black tracking-tight mb-1 bg-gradient-to-br from-accent-teal via-accent-purple to-accent-red bg-clip-text text-transparent">
        🎲 Dice Luck Party
      </h1>
      <p className="text-text-secondary text-lg mb-2.5">
        Roll, reveal, and race to victory!{" "}
        <span className="text-sm text-text-secondary">(Up to 6 players)</span>
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-4 mb-10">
        {/* Name Input */}
        <Input
          id="player-name"
          placeholder="Enter your name..."
          maxLength={16}
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            setNameError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className={nameError ? "border-accent-red!" : ""}
          autoFocus
        />

        {/* Board Size Selector */}
        <div className="flex flex-col gap-2 items-center">
          <label className="text-xs text-text-secondary uppercase tracking-widest">
            Board Size
          </label>
          <div className="flex gap-2 justify-center">
            {BOARD_SIZES.map((size) => (
              <Button
                key={size}
                variant={boardSize === size ? "default" : "secondary"}
                size="sm"
                onClick={() => setBoardSize(size)}
                className={
                  boardSize === size
                    ? "bg-accent-purple! border-accent-purple! text-white shadow-[0_0_12px_rgba(167,139,250,0.3)]"
                    : ""
                }
                id={`size-btn-${size}`}
              >
                {size}x{size}
              </Button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} id="create-room-btn">
          ✨ Create Room
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4 text-text-muted text-xs uppercase tracking-[2px] my-2">
          <span className="flex-1 h-px bg-border-glass" />
          <span>or join a room</span>
          <span className="flex-1 h-px bg-border-glass" />
        </div>

        {/* Join Room */}
        <div className="flex gap-2.5">
          <Input
            id="room-code"
            placeholder="CODE"
            maxLength={4}
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setCodeError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className={`uppercase tracking-[4px] text-center font-bold text-lg max-w-[160px] ${
              codeError ? "border-accent-red!" : ""
            }`}
          />
          <Button variant="secondary" onClick={handleJoin} id="join-room-btn">
            Join
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-2.5 flex justify-between items-center border-t border-border-glass bg-black/20 rounded-b-[20px]">
        <span className="text-xs text-text-muted font-semibold">
          version 2.0.0
        </span>

        <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
          <DialogTrigger asChild>
            <button
              className="w-7 h-7 rounded-full bg-glass border border-border-glass text-accent-teal flex items-center justify-center hover:bg-accent-teal hover:text-background transition-all cursor-pointer text-sm font-extrabold"
              id="help-btn"
              title="How to Play"
            >
              ?
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tutorialSteps[tutorialStep].title}</DialogTitle>
            </DialogHeader>
            <img
              src={`${tutorialSteps[tutorialStep].image}?v=2`}
              alt={tutorialSteps[tutorialStep].title}
              className="w-full h-[280px] object-contain bg-black/20 rounded-xl my-4 border border-border-glass"
            />
            <p className="text-text-secondary text-lg">
              {tutorialSteps[tutorialStep].desc}
            </p>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTutorialStep((s) => s - 1)}
                disabled={tutorialStep === 0}
                className="w-[120px]"
              >
                ◀ Prev
              </Button>
              <span className="text-text-secondary font-bold">
                {tutorialStep + 1} / {tutorialSteps.length}
              </span>
              <Button
                size="sm"
                onClick={() => setTutorialStep((s) => s + 1)}
                disabled={tutorialStep === tutorialSteps.length - 1}
                className="w-[120px]"
              >
                Next ▶
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
