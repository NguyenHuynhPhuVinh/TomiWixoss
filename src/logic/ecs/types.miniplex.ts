// src/logic/ecs/types.miniplex.ts

import { CardData, GamePhase, ZoneKey } from "@/types/game";
import { LogType } from "@/store/types";

// --- 1. ĐỊNH NGHĨA CÁC COMPONENT DƯỚI DẠNG TYPE ---
// Đây là những "mảnh ghép" dữ liệu.

export type CardInfo = { data: CardData };

export type Status = { isFaceUp: boolean; isDowned: boolean };

export type Zone = { owner: "player" | "ai"; zone: ZoneKey; index: number };

export type Underneath = { entities: Entity[] }; // Entity ở đây sẽ là kiểu Entity mới của chúng ta

export type SideEffect =
  | {
      type: "LOG";
      key: string;
      payload?: Record<string, string | number>;
      logType: LogType;
    }
  | {
      type: "UPDATE_UI_FLAG";
      flag: "mustDiscard" | "isZoneViewerOpen";
      value: boolean;
    };

// Định nghĩa kiểu cho các action của người chơi
export type PlayerActionPayload = { type: "place_signi"; cardUuid: string };

// --- 2. ĐỊNH NGHĨA COMPONENT TOÀN CỤC ---
// Dữ liệu không thuộc về lá bài nào cụ thể.

export type GlobalState = {
  phase: GamePhase;
  turn: number;
  actionTakenInPhase: boolean;
  mulliganSelection: string[]; // Lưu trữ UUIDs của các lá bài được chọn để mulligan
  playerAction: PlayerActionPayload | null; // <-- THÊM DÒNG NÀY
};

export type SideEffectQueue = {
  queue: SideEffect[];
};

// --- 3. ĐỊNH NGHĨA ENTITY TỔNG HỢP ---
// Đây là "hình hài" của một object trong World.
// Mỗi thuộc tính là một Component. Dấu `?` có nghĩa là Component đó có thể có hoặc không.
export type Entity = {
  // Components của lá bài
  uuid: string; // Dùng uuid làm định danh chính, thay cho ID số
  cardInfo?: CardInfo;
  status?: Status;
  zone?: Zone;
  underneath?: Underneath;

  // Components đặc biệt
  isGlobal?: true; // "Tag" để nhận diện entity toàn cục
  globalState?: GlobalState;
  sideEffectQueue?: SideEffectQueue;
};
