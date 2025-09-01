// src/store/gameStore.ts
import { create } from "zustand";
import { createLogSlice } from "./slices/logSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createUiSlice } from "./slices/uiSlice";
import { GameStore } from "./types";
// Xóa import gameManager, chúng ta không dùng nó nữa

const useGameStore = create<GameStore>((set, get) => {
  return {
    // === THAY ĐỔI: Chỉ giữ lại các state không thuộc về game logic ===
    worldVersion: 0, // Dùng làm "trigger" để React re-render

    // Kết hợp các slice
    ...createLogSlice(set, get, {} as any),
    ...createGameSlice(set, get, {} as any),
    ...createUiSlice(set, get, {} as any),
  };
});

export default useGameStore;
