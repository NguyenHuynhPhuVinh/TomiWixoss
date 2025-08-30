// src/store/gameStore.ts
import { create } from "zustand";

// Định nghĩa Type cho state để tận dụng TypeScript
interface GameState {
  turn: number;
  phase: "draw" | "ener" | "main" | "attack" | "end";
  playerEner: number;
  increaseTurn: () => void;
  setPlayerEner: (amount: number) => void;
}

// Tạo store
const useGameStore = create<GameState>((set) => ({
  // State ban đầu
  turn: 1,
  phase: "draw",
  playerEner: 0,

  // Actions (hàm để thay đổi state)
  increaseTurn: () => set((state) => ({ turn: state.turn + 1 })),

  setPlayerEner: (amount) => set({ playerEner: amount }),
}));

export default useGameStore;
