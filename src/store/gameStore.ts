// src/store/gameStore.ts
import { create } from "zustand";
import { World } from "@/logic/ecs/world";
import gameManager from "@/logic/ecs/game.manager";
import { GamePhase } from "@/types/game"; // Lấy GamePhase từ types/game.ts
import { LogEntry, LogType, PlayerAction } from "./types"; // Import lại types
import { v4 as uuidv4 } from "uuid";

// Định nghĩa state mới
export interface GameStore {
  world: World | null;
  phase: GamePhase;
  turn: number;
  // Các state UI khác có thể thêm ở đây sau
  isZoneViewerOpen: boolean;
  logs: LogEntry[];
  playerAction: PlayerAction | null;

  // Actions
  _setWorld: (world: World) => void; // Action nội bộ để cập nhật world
  startGame: () => void;
  setPhase: (phase: GamePhase) => void; // Tạm thời cần action này
  addLog: (message: string, type?: LogType) => void;
  initiatePlaceSigni: (cardUuid: string) => void;
  cancelPlayerAction: () => void;
}

const useGameStore = create<GameStore>((set, get) => {
  // Kết nối store với GameManager
  gameManager.onUpdate((updatedWorld) => {
    // Tạo một bản sao nông để trigger re-render
    set({ world: { ...updatedWorld } as World });
  });

  return {
    world: null,
    phase: "pre_game",
    turn: 0,
    isZoneViewerOpen: false,
    logs: [], // Thêm lại state ban đầu
    playerAction: null,

    _setWorld: (world) => set({ world }),

    startGame: () => {
      const newWorld = gameManager.createNewGame();
      set({
        world: newWorld,
        phase: "up", // Bắt đầu thẳng vào Up Phase của Lượt 1
        turn: 1,
      });
      gameManager.startLoop(); // Bắt đầu vòng lặp game
    },

    setPhase: (phase) => set({ phase }),
    addLog: (message, type = "info") => {
      // Thêm lại action
      const newLog: LogEntry = {
        id: uuidv4(),
        message,
        type,
        timestamp: Date.now(),
      };
      set((state) => ({ logs: [newLog, ...state.logs] }));
    },
    initiatePlaceSigni: (cardUuid) =>
      set({ playerAction: { type: "place_signi", cardUuid } }),
    cancelPlayerAction: () => set({ playerAction: null }),
  };
});

export default useGameStore;
