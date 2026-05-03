"use client";

import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useGame, cloneState } from "@/context/game-context";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const GAME_STATE_WAIT_MS = 100;

export function useSocket() {
  const {
    myId,
    gameState,
    setMyId,
    setRoom,
    updateRoom,
    setGameState,
    updateGameState,
    reset,
  } = useGame();

  const socketRef = useRef(null);
  const queuedGameStateRef = useRef(null);
  const queuedGameEventsRef = useRef(null);
  const queuedStateTimerRef = useRef(null);
  const gameStateRef = useRef(gameState);

  // Keep refs in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Process events
  const processEvents = useCallback(
    (events) => {
      if (!events) return;
      for (const event of events) {
        if (event.type === "score") {
          const sign = event.points > 0 ? "+" : "";
          const type = event.points > 0 ? "success" : "error";
          toast[type](
            `${event.playerName} got ${sign}${event.points}! (Score: ${event.newScore})`
          );
        } else if (event.type === "game-end") {
          toast.success(`🎉 ${event.winner.name} wins the game!`);
        } else if (
          event.type === "reveal" ||
          event.type === "reveal-point"
        ) {
          // Trigger flip animation via DOM
          setTimeout(() => {
            const tileEl = document.querySelector(
              `.tile[data-row="${event.row}"][data-col="${event.col}"]`
            );
            if (tileEl) tileEl.classList.add("animate-flip");
          }, 0);

          // Auto-move logic
          setTimeout(() => {
            const gs = gameStateRef.current;
            if (!gs || !gs.players || !gs.players[gs.currentPlayerIndex])
              return;
            const currentPlayer = gs.players[gs.currentPlayerIndex];
            if (!currentPlayer.isYou) return;
            if (gs.phase !== "playing") return;
            if (!gs.diceResult || gs.stepsRemaining <= 0) return;
            if (!gs.validSubMoves || gs.validSubMoves.length !== 1) return;
            const move = gs.validSubMoves[0];
            socketRef.current?.emit(
              "move-player",
              { row: move.row, col: move.col, subPos: move.subPos },
              (res) => {
                if (res?.error) toast.error(res.error);
              }
            );
          }, 400);
        }
      }
    },
    []
  );

  // Animate move sequence
  const animateMoveSequence = useCallback(
    (prevState, finalState, events) => {
      const moveEvents = events.filter((ev) => ev.type === "move");
      if (moveEvents.length === 0) {
        setGameState(finalState);
        processEvents(events);
        return;
      }

      const firstMove = moveEvents[0];
      const autoMoves = moveEvents.slice(1).filter((ev) => ev.auto);

      const firstState = cloneState(prevState);
      const firstPlayer = firstState.players.find(
        (p) => p.id === firstMove.playerId
      );
      if (firstPlayer) {
        firstPlayer.position = { ...firstMove.to };
        firstState.stepsRemaining = firstMove.stepsRemaining;
      }
      updateGameState(firstState);

      if (autoMoves.length === 0) {
        setGameState(finalState);
        processEvents(events);
        return;
      }

      autoMoves.forEach((event, index) => {
        setTimeout(() => {
          const stepState = cloneState(prevState);
          for (let i = 0; i <= index; i++) {
            const currentEvent = moveEvents[i + 1];
            const player = stepState.players.find(
              (p) => p.id === currentEvent.playerId
            );
            if (player) {
              player.position = { ...currentEvent.to };
            }
          }
          stepState.stepsRemaining = autoMoves[index].stepsRemaining;
          updateGameState(stepState);
        }, (index + 1) * 400);
      });

      setTimeout(() => {
        setGameState(finalState);
        processEvents(events);
      }, autoMoves.length * 400);
    },
    [setGameState, updateGameState, processEvents]
  );

  // Process queued update
  const processQueuedUpdate = useCallback(() => {
    queuedStateTimerRef.current = null;
    const nextState = queuedGameStateRef.current;
    const events = queuedGameEventsRef.current;
    queuedGameStateRef.current = null;
    queuedGameEventsRef.current = null;

    if (
      nextState &&
      events &&
      events.some((ev) => ev.type === "move") &&
      gameStateRef.current
    ) {
      animateMoveSequence(gameStateRef.current, nextState, events);
    } else if (nextState) {
      setGameState(nextState);
      if (events) processEvents(events);
    } else if (events) {
      processEvents(events);
    }
  }, [animateMoveSequence, setGameState, processEvents]);

  // Initialize socket
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setMyId(socket.id);
    });

    socket.on("room-update", (data) => {
      updateRoom(data.players, data.hostId);
    });

    socket.on("game-state", (state) => {
      queuedGameStateRef.current = state;
      if (!queuedStateTimerRef.current) {
        queuedStateTimerRef.current = setTimeout(
          processQueuedUpdate,
          GAME_STATE_WAIT_MS
        );
      }
    });

    socket.on("game-events", (events) => {
      queuedGameEventsRef.current = events;
      if (!queuedStateTimerRef.current) {
        queuedStateTimerRef.current = setTimeout(
          processQueuedUpdate,
          GAME_STATE_WAIT_MS
        );
      }
    });

    socket.on("removed-from-room", () => {
      toast.error("You have been removed from the room by the host.");
      reset();
    });

    socket.on("disconnect", () => {
      toast.error("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [setMyId, updateRoom, processQueuedUpdate, reset]);

  // Socket action emitters
  const createRoom = useCallback((playerName, boardSize) => {
    socketRef.current?.emit(
      "create-room",
      { playerName, boardSize },
      (res) => {
        if (res.error) return toast.error(res.error);
        setRoom(res.roomCode, [{ ...res.player, connected: true }], socketRef.current.id);
      }
    );
  }, [setRoom]);

  const joinRoom = useCallback((playerName, roomCode) => {
    socketRef.current?.emit(
      "join-room",
      { playerName, roomCode },
      (res) => {
        if (res.error) return toast.error(res.error);
        toast.success(`Joined room ${res.roomCode}!`);
      }
    );
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit("start-game", null, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  const selectStartTile = useCallback((row, col) => {
    socketRef.current?.emit("select-start-tile", { row, col }, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  const rollDice = useCallback(() => {
    socketRef.current?.emit("roll-dice", null, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  const movePlayer = useCallback((row, col, subPos) => {
    socketRef.current?.emit("move-player", { row, col, subPos }, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  const revealTile = useCallback((row, col) => {
    socketRef.current?.emit("reveal-tile", { row, col }, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  const endTurn = useCallback(() => {
    socketRef.current?.emit("end-turn", null, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  const removePlayer = useCallback((playerId) => {
    socketRef.current?.emit("remove-player", { playerId }, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }, []);

  return {
    createRoom,
    joinRoom,
    startGame,
    selectStartTile,
    rollDice,
    movePlayer,
    revealTile,
    endTurn,
    removePlayer,
  };
}
