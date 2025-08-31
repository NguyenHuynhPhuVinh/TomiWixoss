// src/store/gameStore.ts
import { create } from "zustand";
import { GameStore, PlayerState, GamePhase } from "./types";
import { createLogSlice } from "./slices/logSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createUiSlice } from "./slices/uiSlice"; // Import slice mới

// Định nghĩa state ban đầu cho Player
const initialPlayerState: PlayerState = {
  mainDeck: [],
  lrigDeck: [],
  lrigZone: [null, null, null],
  lifeCloth: [],
  hand: [],
  signiZone: [null, null, null],
  enerZone: [],
  trash: [],
  lrigTrash: [],
  checkZone: [null],
};

// Định nghĩa initialGameState
const initialGameState = {
  game: null, // Bắt đầu với game null
  gameStarted: false,
  phase: "pre_game" as GamePhase,
  turn: 0, // Bắt đầu với turn 0
  player: initialPlayerState,
  ai: initialPlayerState,
  actionTakenInPhase: false,
  playerAction: null,
  isZoneViewerOpen: false,
  viewingLrigDeckForGrow: null,
  mustDiscard: false,
  logs: [],
};

const useGameStore = create<GameStore>((set, get, api) => ({
  ...initialGameState,
  ...createLogSlice(set, get, api),
  ...createGameSlice(set, get, api),
  ...createUiSlice(set, get, api),
}));

export default useGameStore;
