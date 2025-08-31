// src/logic/ecs/components/card.components.ts
import { Component } from "../ecs.types";
import { CardData, ZoneKey, GamePhase } from "@/types/game"; // Import GamePhase
import { Entity } from "../ecs.types"; // Import Entity

/**
 * Chứa dữ liệu tĩnh của lá bài, không bao giờ thay đổi.
 */
export class CardInfoComponent implements Component {
  constructor(public data: CardData) {}
}

/**
 * Chứa trạng thái động của một thực thể trên bàn đấu.
 */
export class StatusComponent implements Component {
  constructor(
    public isFaceUp: boolean = false,
    public isDowned: boolean = false
  ) {}
}

/**
 * Chứa thông tin về vị trí của một thực thể.
 */
export class ZoneComponent implements Component {
  constructor(
    public owner: "player" | "ai",
    public zone: ZoneKey,
    public index: number = 0 // Vị trí trong zone (ví dụ: ô SIGNI số 1, 2, 3)
  ) {}
}

/**
 * Component đánh dấu đây là một lá bài trên tay.
 * (Component trống dùng để đánh dấu/tagging là một kỹ thuật phổ biến trong ECS).
 */
export class InHandComponent implements Component {}

/**
 * Component chứa power hiện tại của một SIGNI.
 */
export class PowerComponent implements Component {
  constructor(public base: number, public modified: number) {}
}

/**
 * Component singleton chứa trạng thái toàn cục của game.
 * Sẽ chỉ có một entity duy nhất trong World có component này.
 */
export class GlobalStateComponent implements Component {
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
    } = { center: null, assists: [] }
  ) {}
}

/**
 * Component singleton chứa các yêu cầu hành động từ người chơi.
 * Các System sẽ đọc component này để biết cần phải làm gì.
 */
export class ActionRequestComponent implements Component {
  public request: { type: string; payload: any } | null = null;
}

/**
 * Component chứa danh sách các Entity đang nằm bên dưới Entity này.
 * Dùng cho cơ chế Grow và Rise.
 */
export class UnderneathComponent implements Component {
  constructor(public entities: Entity[] = []) {}
}
