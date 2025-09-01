// src/logic/game.api.miniplex.ts
import { enerChargeAction } from "./actions.miniplex"; // Import các action cần thiết

export const GameAPI = {
  log: (message: string): void => {
    // Có thể tạo một action riêng để log từ Lua nếu muốn
    console.log(`[LUA] ${message}`);
  },
  enerCharge: (amount: number): void => {
    // Gọi trực tiếp action mới
    enerChargeAction(amount);
  },
  // ... thêm các hàm khác mà Lua cần gọi ở đây
};
