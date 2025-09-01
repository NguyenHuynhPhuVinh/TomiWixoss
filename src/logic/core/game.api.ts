// src/logic/core/game.api.ts
import gameManager from "../ecs/game.manager";
import { GameAction } from "./actions.types";

// Đây là object chứa các hàm mà chúng ta muốn expose cho Lua
export const GameAPI = {
  /**
   * Ghi một tin nhắn vào Log Trận Đấu.
   * @param message - Tin nhắn cần hiển thị.
   */
  log: (message: string): void => {
    // Đây là một side effect, nên chúng ta có thể queue nó
    gameManager.queueSideEffect({
      type: "LOG",
      message: `[LUA] ${message}`,
      logType: "info",
    });
  },

  /**
   * Ra lệnh cho engine thực hiện Ener Charge.
   * @param amount - Số lượng lá bài cần nạp.
   */
  enerCharge: (amount: number): void => {
    const action: GameAction = {
      type: "ENER_CHARGE",
      payload: { amount, player: "player" }, // Tạm thời hard-code player
    };
    gameManager.queueAction(action);
  },

  // ... Thêm các hàm API khác ở đây sau này ...
  // Ví dụ:
  // getTurn: (): number => { /* ... */ },
  // getEntitiesInZone: (zone: string): Entity[] => { /* ... */ },
  // damagePlayer: (amount: number) => { /* ... */ },
};
