"use client";

import { useGame } from "@/context/game-context";
import { useSocket } from "@/hooks/use-socket";
import Lobby from "./lobby";
import WaitingRoom from "./waiting-room";
import GameBoard from "./game-board";
import Dice from "./dice";
import HUD from "./hud";
import GameOver from "./game-over";

export default function GameApp() {
  const {
    screen,
    myId,
    myRoomCode,
    roomPlayers,
    roomHostId,
    gameState,
    reset,
  } = useGame();

  const {
    createRoom,
    joinRoom,
    startGame,
    selectStartTile,
    rollDice,
    movePlayer,
    revealTile,
    removePlayer,
  } = useSocket();

  const handleTileClick = (row, col, subPos) => {
    if (!gameState) return;
    if (gameState.phase === "selecting-start") {
      selectStartTile(row, col);
    } else if (gameState.phase === "playing") {
      if (subPos === "reveal") {
        revealTile(row, col);
      } else {
        movePlayer(row, col, subPos);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5">
      {screen === "lobby" && (
        <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      )}

      {screen === "waiting" && (
        <WaitingRoom
          roomCode={myRoomCode}
          players={roomPlayers}
          hostId={roomHostId}
          myId={myId}
          isHost={roomHostId === myId}
          onStart={startGame}
          onLeave={() => {
            reset();
            window.location.reload();
          }}
          onRemovePlayer={removePlayer}
        />
      )}

      {screen === "game" && gameState && (
        <div className="flex gap-6 items-start justify-center w-full max-w-[1200px] flex-wrap">
          {/* Sidebar */}
          <div className="w-60 flex flex-col gap-4 shrink-0 max-md:w-full max-md:max-w-[400px] max-md:flex-row max-md:flex-wrap max-md:[&>*]:flex-1 max-md:[&>*]:min-w-[200px]">
            <HUD state={gameState} />
            <Dice state={gameState} onRoll={rollDice} />
          </div>

          {/* Board */}
          <GameBoard state={gameState} onTileClick={handleTileClick} />
        </div>
      )}

      {screen === "gameover" && gameState && (
        <GameOver
          state={gameState}
          onPlayAgain={() => window.location.reload()}
        />
      )}
    </div>
  );
}
