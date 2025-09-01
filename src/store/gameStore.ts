// src/store/gameStore.ts
import { create } from "zustand";
import { createLogSlice } from "./slices/logSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createUiSlice } from "./slices/uiSlice";
import { GameStore } from "./types";
// Xóa import gameManager, chúng ta không dùng nó nữa

const useGameStore = create<GameStore>((set, get) => {
  // Không cần listener onUpdate nữa. Game engine sẽ tự gọi syncStateFromWorld.

  return {
    // Các state ban đầu
    worldVersion: 0,
    phase: "pre_game",
    turn: 0,
    actionTakenInPhase: false,
    boardState: {
      player: { signiZone: [null, null, null], lrigZone: [null, null, null] },
    },

    // Kết hợp các slice
    ...createLogSlice(set, get, {} as any),
    ...createGameSlice(set, get, {} as any),
    ...createUiSlice(set, get, {} as any),
  };
});

export default useGameStore;
