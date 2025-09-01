// src/logic/engine.setup.ts
import luaService from "./lua/lua.service";
import { GameAPI } from "./game.api.miniplex";
import { initializeScriptingSystem } from "./ecs/systems/scripting.system";
import { startGameLoop } from "./game.engine.miniplex";

let isInitialized = false;

/**
 * Khởi tạo toàn bộ game engine.
 * Chỉ nên được gọi MỘT LẦN khi ứng dụng bắt đầu.
 */
export async function bootstrapGame() {
  if (isInitialized) return; // <-- Ngăn chặn chạy lại
  isInitialized = true; // <-- Đặt cờ ngay lập tức

  console.log("--- Bootstrapping Game Engine ---");

  // 1. Khởi tạo các dịch vụ cốt lõi (bất đồng bộ)
  await luaService.initialize();

  // 2. Expose API cho Lua
  luaService.expose("Game", GameAPI);

  // 3. Khởi tạo các system cần lắng nghe sự kiện
  initializeScriptingSystem();

  // 4. Bắt đầu vòng lặp game
  startGameLoop();

  console.log("--- Game Engine Bootstrapped Successfully ---");
}
