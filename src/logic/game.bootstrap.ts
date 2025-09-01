// src/logic/game.bootstrap.ts
import { enableMapSet } from "immer"; // <-- IMPORT ENABLE MAPSET
import { registerWixossModule } from "./wixoss.module";
import luaService from "./lua/lua.service";
import { GameAPI } from "./core/game.api";

export async function initializeWixossEngine() {
  // <-- Chuyển thành async
  // === KÍCH HOẠT IMMER PLUGIN CHO MAP/SET ===
  enableMapSet(); // <-- BẮT BUỘC CHO IMMER XỬ LÝ Map VÀ Set
  // ============================================

  // Khởi tạo Lua và expose API TRƯỚC khi đăng ký các module
  await luaService.initialize();
  luaService.expose("Game", GameAPI);

  registerWixossModule();
}
