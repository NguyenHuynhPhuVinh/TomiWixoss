// src/store/gameStore.ts
import { create } from "zustand";
import { World } from "@/logic/ecs/world";
import gameManager from "@/logic/ecs/game.manager";
import { GamePhase } from "@/types/game"; // Lấy GamePhase từ types/game.ts
import { LogEntry, LogType, PlayerAction } from "./types"; // Import lại types
import { v4 as uuidv4 } from "uuid";
import { GlobalStateComponent } from "@/logic/ecs/components/card.components";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";

export interface GameStore {
  world: World | null;
  worldVersion: number;
  // Các state "gương" để UI theo dõi
  phase: GamePhase;
  turn: number;
  actionTakenInPhase: boolean;

  // State UI
  logs: LogEntry[];
  playerAction: PlayerAction | null;
  isZoneViewerOpen: boolean;

  // Actions
  initializeGame: () => void;
  _syncStateFromWorld: (world: World) => void;
  setPhase: (phase: GamePhase) => void; // Tạm thời cần action này
  addLog: (message: string, type?: LogType) => void;
  initiatePlaceSigni: (cardUuid: string) => void;
  cancelPlayerAction: () => void;
}

const useGameStore = create<GameStore>((set, get) => {
  // Kết nối store với GameManager
  gameManager.onUpdate((updatedWorld) => {
    // Chỉ gọi hàm đồng bộ hóa
    get()._syncStateFromWorld(updatedWorld);
  });

  return {
    world: null,
    worldVersion: 0,
    phase: "pre_game",
    turn: 0,
    actionTakenInPhase: false,
    logs: [],
    playerAction: null,
    isZoneViewerOpen: false,

    _syncStateFromWorld: (world) => {
      const globalState = world.getComponent(
        GLOBAL_ENTITY,
        GlobalStateComponent
      );
      set((state) => ({
        world: world, // <-- Lưu trực tiếp instance, KHÔNG sao chép
        worldVersion: state.worldVersion + 1,
        // Đồng bộ hóa các state "gương"
        phase: globalState?.phase ?? state.phase,
        turn: globalState?.turn ?? state.turn,
        actionTakenInPhase:
          globalState?.actionTakenInPhase ?? state.actionTakenInPhase,
      }));
    },

    initializeGame: () => {
      const newWorld = gameManager.createNewGame();
      const globalState = newWorld.getComponent(
        GLOBAL_ENTITY,
        GlobalStateComponent
      )!;

      // Logic khởi tạo deck đã nằm trong GameFactory, giờ chỉ cần chuyển phase
      globalState.phase = "selecting_lrigs";

      set({
        world: newWorld,
        worldVersion: 1,
        phase: globalState.phase,
        turn: globalState.turn,
        actionTakenInPhase: globalState.actionTakenInPhase,
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
