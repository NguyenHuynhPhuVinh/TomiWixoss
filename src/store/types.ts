// src/store/types.ts
import { GamePhase } from "@/types/game";
import { World } from "@/logic/ecs/world";

// Định nghĩa kiểu cho một entry trong log
export type LogType = "info" | "action" | "system" | "cost";
export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: number;
}

// Định nghĩa một kiểu cho các hành động của người chơi trên UI
export type PlayerAction = {
  type: "place_signi";
  cardUuid: string; // Thực ra đây là Entity ID dạng string
};

// Interface cho STATE của toàn bộ store
export interface GameState {
  world: World | null;
  worldVersion: number;

  // Các state "gương" được đồng bộ từ GlobalStateComponent trong World
  phase: GamePhase;
  turn: number;
  actionTakenInPhase: boolean;

  // State của UI
  logs: LogEntry[];
  playerAction: PlayerAction | null;
  isZoneViewerOpen: boolean;
  viewingLrigDeckForGrow: { forAssistIndex: number | null } | null;
  boardState: any; // Sẽ được định nghĩa chi tiết hơn
}

// Interface cho ACTIONS của toàn bộ store
export interface GameActions {
  // Log Actions
  addLog: (message: string, type?: LogType) => void;

  // Game/World Actions
  initializeGame: () => void;
  _syncStateFromWorld: (world: World) => void;

  // UI Actions
  initiatePlaceSigni: (cardUuid: string) => void;
  cancelPlayerAction: () => void;
  openZoneViewer: () => void;
  closeZoneViewer: () => void;
  closeLrigDeckViewer: () => void;
  openLrigDeckViewerForAssist: (zoneIndex: number) => void;
}

// Interface tổng hợp
export interface GameStore extends GameState, GameActions {}
