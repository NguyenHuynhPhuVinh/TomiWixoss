// src/store/gameStore.ts
import { create } from "zustand";
import { World } from "@/logic/ecs/world";
import gameManager from "@/logic/ecs/game.manager";
import { GamePhase, CardInstance } from "@/types/game"; // Lấy GamePhase từ types/game.ts
import { LogEntry, LogType, PlayerAction } from "./types"; // Import lại types
import { v4 as uuidv4 } from "uuid";
import {
  GlobalStateComponent,
  ZoneComponent,
  CardInfoComponent,
  StatusComponent,
} from "@/logic/ecs/components/card.components";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";

// Định nghĩa một kiểu đơn giản cho trạng thái bàn đấu
export interface BoardState {
  player: {
    signiZone: (CardInstance | null)[];
    lrigZone: (CardInstance | null)[];
    // Thêm các zone khác nếu cần
  };
}

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

  // Board state đơn giản hóa
  boardState: BoardState;

  // Actions
  initializeGame: () => void;
  _syncStateFromWorld: (world: World) => void;
  setPhase: (phase: GamePhase) => void; // Tạm thời cần action này
  addLog: (message: string, type?: LogType) => void;
  initiatePlaceSigni: (cardUuid: string) => void;
  cancelPlayerAction: () => void;
  openZoneViewer: () => void;
  closeZoneViewer: () => void;
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
    boardState: {
      player: { signiZone: [null, null, null], lrigZone: [null, null, null] },
    },

    _syncStateFromWorld: (world) => {
      const globalState = world.getComponent(
        GLOBAL_ENTITY,
        GlobalStateComponent
      );

      // === TẠO VÀ CẬP NHẬT boardState ===
      const newBoardState: BoardState = {
        player: {
          signiZone: [null, null, null],
          lrigZone: [null, null, null],
        },
      };

      const entitiesOnField = world.query([
        ZoneComponent,
        CardInfoComponent,
        StatusComponent,
      ]);
      for (const entity of entitiesOnField) {
        const zone = world.getComponent(entity, ZoneComponent)!;
        const cardInfo = world.getComponent(entity, CardInfoComponent)!;
        const status = world.getComponent(entity, StatusComponent)!;

        const cardInstance: CardInstance = {
          ...cardInfo.data,
          ...status,
          uuid: entity.toString(),
          owner: zone.owner,
        };

        if (zone.zone === "signiZone") {
          newBoardState.player.signiZone[zone.index] = cardInstance;
        }
        if (zone.zone === "lrigZone") {
          newBoardState.player.lrigZone[zone.index] = cardInstance;
        }
      }
      // ===================================

      set((state) => ({
        world: world, // <-- Lưu trực tiếp instance, KHÔNG sao chép
        worldVersion: state.worldVersion + 1,
        // Đồng bộ hóa các state "gương"
        phase: globalState?.phase ?? state.phase,
        turn: globalState?.turn ?? state.turn,
        actionTakenInPhase:
          globalState?.actionTakenInPhase ?? state.actionTakenInPhase,
        boardState: newBoardState,
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
        boardState: {
          player: {
            signiZone: [null, null, null],
            lrigZone: [null, null, null],
          },
        },
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
    openZoneViewer: () => set({ isZoneViewerOpen: true }),
    closeZoneViewer: () => set({ isZoneViewerOpen: false }),
  };
});

export default useGameStore;
