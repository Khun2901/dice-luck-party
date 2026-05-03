"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";

const GameContext = createContext(null);

const initialState = {
  myId: null,
  myRoomCode: null,
  roomPlayers: [],
  roomHostId: null,
  gameState: null,
  previousGameState: null,
  screen: "lobby", // "lobby" | "waiting" | "game" | "gameover"
};

function cloneState(state) {
  if (!state) return null;
  return typeof structuredClone === "function"
    ? structuredClone(state)
    : JSON.parse(JSON.stringify(state));
}

function gameReducer(state, action) {
  switch (action.type) {
    case "SET_MY_ID":
      return { ...state, myId: action.payload };

    case "SET_ROOM":
      return {
        ...state,
        myRoomCode: action.payload.roomCode,
        roomPlayers: action.payload.players || state.roomPlayers,
        roomHostId: action.payload.hostId || state.roomHostId,
        screen: "waiting",
      };

    case "UPDATE_ROOM":
      return {
        ...state,
        roomPlayers: action.payload.players,
        roomHostId: action.payload.hostId,
        screen: state.gameState ? state.screen : "waiting",
      };

    case "SET_GAME_STATE": {
      const newState = action.payload;
      const screen =
        newState.phase === "ended" ? "gameover" : "game";
      return {
        ...state,
        previousGameState: state.gameState
          ? cloneState(state.gameState)
          : null,
        gameState: newState,
        screen,
      };
    }

    case "UPDATE_GAME_STATE":
      return {
        ...state,
        gameState: action.payload,
      };

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setMyId = useCallback(
    (id) => dispatch({ type: "SET_MY_ID", payload: id }),
    []
  );

  const setRoom = useCallback(
    (roomCode, players, hostId) =>
      dispatch({ type: "SET_ROOM", payload: { roomCode, players, hostId } }),
    []
  );

  const updateRoom = useCallback(
    (players, hostId) =>
      dispatch({ type: "UPDATE_ROOM", payload: { players, hostId } }),
    []
  );

  const setGameState = useCallback(
    (gameState) => dispatch({ type: "SET_GAME_STATE", payload: gameState }),
    []
  );

  const updateGameState = useCallback(
    (gameState) => dispatch({ type: "UPDATE_GAME_STATE", payload: gameState }),
    []
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        setMyId,
        setRoom,
        updateRoom,
        setGameState,
        updateGameState,
        reset,
        cloneState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

export { cloneState };
