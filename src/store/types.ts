// src/store/types.ts
// === THAY ĐỔI: Import GamePhase từ file constants mới ===
import { GamePhase } from "@/logic/constants";
// import { PlayerAction } from "./slices/uiSlice";

// Định nghĩa kiểu cho một entry trong log
export type LogType = "info" | "action" | "system" | "cost";
export interface LogEntry {
  id: string;
  // Thay thế 'message' bằng 'key' và 'payload'
  key: string; // Key để tra cứu trong file JSON, ví dụ: 'logs.enerCharge'
  payload?: Record<string, string | number>; // Các biến động, ví dụ: { cardName: 'Servant #' }
  type: LogType;
  timestamp: number;
}

// Định nghĩa một kiểu cho các hành động của người chơi trên UI
// export type PlayerAction = {
//   type: "place_signi";
//   cardUuid: string; // Thực ra đây là Entity ID dạng string
// };

// Interface cho STATE của toàn bộ store
export interface GameState {
  worldVersion: number;

  // === THAY ĐỔI: Xóa các state không còn được quản lý bởi Zustand ===
  // phase: GamePhase;
  // turn: number;
  // actionTakenInPhase: boolean;
  // boardState: any;

  // State của UI (vẫn giữ lại)
  logs: LogEntry[];
  // playerAction: PlayerAction | null; // <-- XÓA
  isZoneViewerOpen: boolean;
  viewingLrigDeckForGrow: { forAssistIndex: number | null } | null;
  mustDiscard: boolean;
}

// Interface cho ACTIONS của toàn bộ store
export interface GameActions {
  // Log Actions
  addLog: (logData: Omit<LogEntry, "id" | "timestamp">) => void;

  // Game/World Actions
  initializeGame: () => void;
  // === THAY ĐỔI: Thay thế syncStateFromWorld bằng incrementWorldVersion ===
  incrementWorldVersion: () => void;

  // UI Actions
  // initiatePlaceSigni: (cardUuid: string) => void; // <-- XÓA
  // cancelPlayerAction: () => void; // <-- XÓA
  openZoneViewer: () => void;
  closeZoneViewer: () => void;
  openLrigDeckViewerForAssist: (zoneIndex: number) => void;
  setMustDiscard: (mustDiscard: boolean) => void;
}

// Interface tổng hợp
export interface GameStore extends GameState, GameActions {}
