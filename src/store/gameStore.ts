// src/store/gameStore.ts
import { create } from "zustand";
import { World } from "@/logic/ecs/world";

// Định nghĩa lại state
interface GameStore {
  world: World | null;
  phase: string; // Tạm thời vẫn giữ phase ở đây
  actionTakenInPhase: boolean;

  // Actions
  setWorld: (world: World) => void;
  setPhase: (phase: string) => void;
  setActionTakenInPhase: (taken: boolean) => void;
}

const useGameStore = create<GameStore>((set) => ({
  world: null,
  phase: "pre_game",
  actionTakenInPhase: false,

  setWorld: (world) => set({ world }),
  setPhase: (phase) => set({ phase }),
  setActionTakenInPhase: (taken) => set({ actionTakenInPhase: taken }),
}));

export default useGameStore;
