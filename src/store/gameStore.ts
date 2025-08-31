// src/store/gameStore.ts
import { create } from "zustand";
import { GameStore, PlayerState } from "./types";
import { createLogSlice } from "./slices/logSlice";
import { createSetupSlice } from "./slices/setupSlice";
import { createPhaseSlice } from "./slices/phaseSlice";
import { createPlayerActionsSlice } from "./slices/playerActionsSlice";
import { createUiSlice } from "./slices/uiSlice";
import { CardInstance } from "@/types/game";

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
  player: initialPlayerState,
  ai: initialPlayerState,

  // --- TÍCH HỢP CÁC SLICES ---
  ...createLogSlice(set, get, api),
  ...createSetupSlice(set, get, api),
  ...createPhaseSlice(set, get, api),
  ...createPlayerActionsSlice(set, get, api),
  ...createUiSlice(set, get, api),
}));

export default useGameStore;
