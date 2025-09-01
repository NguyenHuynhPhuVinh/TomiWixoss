// src/logic/ecs/components/card.components.ts
import { Component } from "../ecs.types";
import { CardData, ZoneKey, GamePhase } from "@/types/game"; // Import GamePhase
import { Entity } from "../ecs.types"; // Import Entity
import { LogType } from "@/store/types"; // Import LogType
import { GameAction } from "../../core/actions.types"; // <-- IMPORT
import { immerable } from "immer"; // <-- IMPORT IMMERABLE
import { Effect } from "../effects.types";

/**
 * Chứa dữ liệu tĩnh của lá bài, không bao giờ thay đổi.
 */
export class CardInfoComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  constructor(public data: CardData) {}
}

/**
 * Chứa trạng thái động của một thực thể trên bàn đấu.
 */
export class StatusComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  constructor(
    public isFaceUp: boolean = false,
    public isDowned: boolean = false
  ) {}
}

/**
 * Chứa thông tin về vị trí của một thực thể.
 */
export class ZoneComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  constructor(
    public owner: "player" | "ai",
    public zone: ZoneKey,
    public index: number = 0 // Vị trí trong zone (ví dụ: ô SIGNI số 1, 2, 3)
  ) {}
}

/**
 * Component chứa power hiện tại của một SIGNI.
 */
export class PowerComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  constructor(public base: number, public modified: number) {}
}

/**
 * Component singleton chứa trạng thái toàn cục của game.
 * Sẽ chỉ có một entity duy nhất trong World có component này.
 */
export class GlobalStateComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  constructor(
    public phase: GamePhase = "pre_game",
    public turn: number = 0,
    public actionTakenInPhase: boolean = false,

    // === THÊM CÁC STATE MỚI CHO SETUP ===
    // Mảng Entity ID của các lá bài người chơi chọn để mulligan
    public mulliganSelection: Entity[] = [],
    // Trạng thái chọn LRIG
    public lrigSelection: {
      center: Entity | null;
      assists: Entity[];
    } = { center: null, assists: [] },
    // Thêm state mới cho engine
    public engineState: "IDLE" | "RESOLVING_STACK" = "IDLE"
  ) {}
}

/**
 * Component singleton chứa các yêu cầu hành động từ người chơi.
 * Các System sẽ đọc component này để biết cần phải làm gì.
 */
export class ActionRequestComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  public request: GameAction | null = null;
}

/**
 * Component chứa danh sách các Entity đang nằm bên dưới Entity này.
 * Dùng cho cơ chế Grow và Rise.
 */
export class UnderneathComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  constructor(public entities: Entity[] = []) {}
}

// Định nghĩa các loại hiệu ứng phụ
interface LogSideEffect {
  type: "LOG";
  message: string;
  logType: LogType;
}
interface UpdateUIFlagSideEffect {
  type: "UPDATE_UI_FLAG";
  flag: "mustDiscard" | "isZoneViewerOpen";
  value: boolean;
}
// Thêm các loại khác sau này

export type SideEffect = LogSideEffect | UpdateUIFlagSideEffect;

/**
 * Component singleton chứa một hàng đợi các "hiệu ứng phụ"
 * mà engine muốn thông báo cho thế giới bên ngoài (UI).
 */
export class SideEffectComponent implements Component {
  static [immerable] = true; // <-- ĐÁNH DẤU IMMERABLE
  public queue: SideEffect[] = [];
}

/**
 * Component singleton chứa ngăn xếp hiệu ứng đang chờ được xử lý.
 */
export class EffectStackComponent implements Component {
  static [immerable] = true;
  public stack: Effect[] = [];
}
