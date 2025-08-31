// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { UpSystem } from "./systems/up.system";
import { DrawSystem } from "./systems/draw.system";
import { EnerSystem } from "./systems/ener.system"; // <-- IMPORT
import { GrowSystem } from "./systems/grow.system"; // <-- IMPORT
import { PhaseSystem } from "./systems/phase.system"; // <-- IMPORT
import { SetupSystem } from "./systems/setup.system"; // <-- IMPORT
import { System } from "./ecs.types";
import { GLOBAL_ENTITY } from "./game.factory";
import { ActionRequestComponent } from "./components/card.components";

type UpdateListener = (world: World) => void;

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private animationFrameId: number = 0;
  // Tách các system ra
  private loopSystems: System[] = [];
  private actionSystems: { [key: string]: System } = {};

  public createNewGame(): World {
    this.world = this.factory.createNewGame();

    // Phân loại các system
    this.actionSystems["SETUP"] = new SetupSystem();
    this.actionSystems["ENER"] = new EnerSystem();
    this.actionSystems["GROW"] = new GrowSystem(); // <-- THÊM VÀO ĐÂY
    this.actionSystems["PHASE"] = new PhaseSystem();
    // ... các system hành động khác

    this.loopSystems.push(new UpSystem());
    this.loopSystems.push(new DrawSystem());
    this.loopSystems.push(new PhaseSystem());

    return this.world;
  }

  public onUpdate(listener: UpdateListener) {
    this.updateListeners.push(listener);
  }

  private loop() {
    if (!this.isLooping || !this.world) return;

    // Vòng lặp chỉ chạy các system "tự động"
    for (const system of this.loopSystems) {
      system.update(this.world);
    }

    this.updateListeners.forEach((listener) => listener(this.world!));
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  public startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    this.loop();
  }

  public stopLoop() {
    if (!this.isLooping) return;
    this.isLooping = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Tạm dừng vòng lặp, chạy các system một lần, và thông báo cập nhật.
   * Dùng cho các hành động cần phản hồi ngay lập tức từ người chơi.
   */
  public forceUpdate() {
    if (!this.world) return;
    this.stopLoop(); // Tạm dừng vòng lặp tự động

    this.world.update();
    this.updateListeners.forEach((listener) => listener(this.world!));

    this.startLoop(); // Khởi động lại vòng lặp
  }

  /**
   * Xử lý một hành động cụ thể được yêu cầu bởi người chơi.
   * @param actionType - Loại hành động (ví dụ: 'ENER', 'PLACE_SIGNI').
   */
  public handlePlayerAction() {
    if (!this.world) return;

    // Lấy ra ActionRequestComponent để xem người chơi muốn làm gì
    const actionRequest = this.world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );
    if (!actionRequest || !actionRequest.request) return;

    const requestType = actionRequest.request.type; // Ví dụ: 'CHARGE_ENER'

    // Tìm system tương ứng để xử lý
    // Chúng ta có thể tạo một map để nối 'CHARGE_ENER' với 'ENER' system
    let systemKey: string;
    switch (requestType) {
      case "CHARGE_ENER":
        systemKey = "ENER";
        break;
      case "GROW_LRIG":
        systemKey = "GROW";
        break;
      case "ADVANCE_PHASE":
        systemKey = "PHASE";
        break;
      case "CONFIRM_LRIG_SELECTION":
        systemKey = "SETUP";
        break;
      case "CONFIRM_MULLIGAN":
        systemKey = "SETUP";
        break;
      default:
        console.warn(`Unknown action type: ${requestType}`);
        return;
    }

    const systemToRun = this.actionSystems[systemKey];

    if (systemToRun) {
      console.log(`--- Handling player action via ${requestType} ---`);
      systemToRun.update(this.world);

      // Sau khi action được xử lý, thông báo cho UI cập nhật
      this.notifyUpdate();
    }
  }

  /**
   * Chỉ thông báo cho listener (Zustand) để re-render UI.
   * Dùng cho các thay đổi state không cần chạy System ngay lập tức.
   */
  public notifyUpdate() {
    if (!this.world) return;
    this.updateListeners.forEach((listener) => listener(this.world!));
  }
}

const gameManager = new GameManager();
export default gameManager;
