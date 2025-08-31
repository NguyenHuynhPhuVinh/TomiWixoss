// src/logic/game.bootstrap.ts
import { enableMapSet } from "immer"; // <-- IMPORT ENABLE MAPSET
import gameManager from "./ecs/game.manager";

// Import tất cả các System của Wixoss
import { SetupSystem } from "./ecs/systems/setup.system";
import { EnerSystem } from "./ecs/systems/ener.system";
import { GrowSystem } from "./ecs/systems/grow.system";
import { PlaceSigniSystem } from "./ecs/systems/placeSigni.system";
import { DiscardSystem } from "./ecs/systems/discard.system";
import { UpSystem } from "./ecs/systems/up.system";
import { DrawSystem } from "./ecs/systems/draw.system";
import { PhaseSystem } from "./ecs/systems/phase.system";
import { SideEffectSystem } from "./ecs/systems/sideEffect.system";

export function initializeWixossEngine() {
  // === KÍCH HOẠT IMMER PLUGIN CHO MAP/SET ===
  enableMapSet(); // <-- BẮT BUỘC CHO IMMER XỬ LÝ Map VÀ Set
  // ============================================

  // Đăng ký tất cả các System đặc thù của Wixoss theo thứ tự quan trọng
  // Các system xử lý action của người chơi nên ở trên
  gameManager.registerSystem(new SetupSystem());
  gameManager.registerSystem(new EnerSystem());
  gameManager.registerSystem(new GrowSystem());
  gameManager.registerSystem(new PlaceSigniSystem());
  gameManager.registerSystem(new DiscardSystem());

  // Các system tự động ở dưới
  gameManager.registerSystem(new UpSystem());
  gameManager.registerSystem(new DrawSystem());
  gameManager.registerSystem(new PhaseSystem());

  // LUÔN ĐĂNG KÝ SIDEEFFECTSYSTEM CUỐI CÙNG
  gameManager.registerSystem(new SideEffectSystem());

  // Khởi tạo các system sau khi đăng ký xong
  gameManager.initializeSystems();
}
