// src/store/types.ts
import { CardInstance } from "@/types/game"; // Import các type cần thiết

// Định nghĩa kiểu cho một entry trong log
export type LogType = "info" | "action" | "system" | "cost";
export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: number;
}

// Giữ GamePhase ở đây để các slice khác có thể dùng
export type GamePhase =
  | "pre_game"
  | "selecting_lrigs"
  | "mulligan"
  | "up"
  | "draw"
  | "ener"
  | "grow"
  | "main"
  | "attack"
  | "end";

export const TURN_PHASES: GamePhase[] = [
  "up",
  "draw",
  "ener",
  "grow",
  "main",
  "attack",
  "end",
];

// Định nghĩa một kiểu cho các hành động của người chơi
export type PlayerAction = {
  type: "place_signi";
  cardUuid: string;
};

export interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  lrigZone: (CardInstance | null)[];
  lifeCloth: CardInstance[];
  hand: CardInstance[];
  signiZone: (CardInstance | null)[];
  enerZone: CardInstance[];
  trash: CardInstance[];
  lrigTrash: CardInstance[];
  checkZone: (CardInstance | null)[];
}

// Interface cho phần state thuần túy
export interface GameState {
  gameStarted: boolean;
  phase: GamePhase;
  turn: number;
  player: PlayerState;
  ai: PlayerState;
  mulliganSelection: string[]; // Thêm để lưu các lá bài được chọn cho mulligan
  mustDiscard: boolean;
  actionTakenInPhase: boolean;
  playerAction: PlayerAction | null;
  isZoneViewerOpen: boolean;
  viewingLrigDeckForGrow: { forAssistIndex: number | null } | null;
  logs: LogEntry[];
}

// Interface cho tất cả các action
export interface GameActions {
  // Setup Actions
  prepareDecks: () => void;
  drawInitialHand: () => void;
  performMulligan: (cardsToReturnUuids: string[]) => void;
  dealRemainingSetup: (
    centerUuid: string,
    assist1Uuid: string,
    assist2Uuid: string
  ) => void;
  dealRemainingSetupAfterMulligan: () => void;
  setMulliganSelection: (selection: string[]) => void;

  // Phase Actions
  goToNextPhase: () => void;

  // Player Actions
  upAllCards: () => void;
  discardCardFromHand: (cardUuid: string) => void;
  checkEndPhaseConditions: () => void;
  growCenterLrig: (targetLrigUuid: string) => void;
  growAssistLrig: (targetLrigUuid: string, fromZoneIndex: number) => void;
  initiatePlaceSigni: (cardUuid: string) => void;
  cancelPlayerAction: () => void;

  // UI Actions
  openZoneViewer: () => void;
  closeZoneViewer: () => void;
  openLrigDeckViewerForAssist: (zoneIndex: number) => void;
  closeLrigDeckViewer: () => void;

  // Log Actions
  addLog: (message: string, type?: LogType) => void;
}

// Đây sẽ là interface tổng hợp, bao gồm cả state và các action từ các slice
export interface GameStore extends GameState, GameActions {}
