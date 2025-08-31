// src/store/gameStore.ts
import { create } from "zustand";
import { GameStore, PlayerState } from "./types";
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

const useGameStore = create<GameStore>((set, get, api) => ({
  // --- STATE BAN ĐẦU ---
  gameStarted: false,
  phase: "pre_game",
  turn: 1,
  player: initialPlayerState,
  ai: initialPlayerState,
  actionTakenInPhase: false,

  // --- TÍCH HỢP CÁC SLICES ---
  ...createLogSlice(set, get, api),
  ...createGameSlice(set, get, api),
  ...createUiSlice(set, get, api),
}));

export default useGameStore;
