// src/logic/game.bootstrap.ts
import { enableMapSet } from "immer"; // <-- IMPORT ENABLE MAPSET
import { registerWixossModule } from "./wixoss.module";

export function initializeWixossEngine() {
  // === KÍCH HOẠT IMMER PLUGIN CHO MAP/SET ===
  enableMapSet(); // <-- BẮT BUỘC CHO IMMER XỬ LÝ Map VÀ Set
  // ============================================
  registerWixossModule();
}
