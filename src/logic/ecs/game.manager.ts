// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { System } from "./ecs.types";
import { GLOBAL_ENTITY } from "./game.factory";
import { ActionRequestComponent } from "./components/card.components";

// Import tất cả các system
import { SetupSystem } from "./systems/setup.system";
import { EnerSystem } from "./systems/ener.system";
import { GrowSystem } from "./systems/grow.system";
import { PlaceSigniSystem } from "./systems/placeSigni.system";
import { DiscardSystem } from "./systems/discard.system";
import { UpSystem } from "./systems/up.system";
import { DrawSystem } from "./systems/draw.system";
import { PhaseSystem } from "./systems/phase.system";
import { AdvancePhaseSystem } from "./systems/advancePhase.system";

type UpdateListener = (world: World) => void;

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private animationFrameId: number = 0;

  private actionQueue: { type: string; payload?: any }[] = [];

  // Chỉ còn một danh sách system duy nhất
  private systems: System[] = [];

  public createNewGame(): World {
    this.world = this.factory.createNewGame();

    // Thứ tự rất quan trọng
    // Các system xử lý action của người chơi nên ở trên
    this.systems.push(new SetupSystem());
    this.systems.push(new EnerSystem());
    this.systems.push(new GrowSystem());
    this.systems.push(new PlaceSigniSystem());
    this.systems.push(new DiscardSystem());
    this.systems.push(new AdvancePhaseSystem());
    // Các system tự động ở dưới
    this.systems.push(new UpSystem());
    this.systems.push(new DrawSystem());
    this.systems.push(new PhaseSystem());

    return this.world;
  }

  public onUpdate(listener: UpdateListener) {
    this.updateListeners.push(listener);
  }

  public stopLoop() {
    if (!this.isLooping) return;
    this.isLooping = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  public startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  public queueAction(action: { type: string; payload?: any }) {
    console.log(
      `%cACTION QUEUED: ${action.type}`,
      "color: #F39C12",
      action.payload
    );
    this.actionQueue.push(action);
    // "Đánh thức" vòng lặp nếu nó đang ngủ
    if (!this.isLooping) {
      console.log(
        "%cWaking up game loop to process action...",
        "color: #3498DB"
      );
      this.startLoop();
    }
  }

  private loop() {
    if (!this.world) return;
    if (!this.isLooping) {
      // Nếu vòng lặp bị dừng bởi một system (như PhaseSystem),
      // chúng ta vẫn cần cập nhật UI lần cuối cùng.
      this.notifyUpdate();
      return;
    }

    // --- LOGIC VÒNG LẶP MỚI, TUẦN TỰ HƠN ---

    // 1. Ưu tiên xử lý MỘT action từ queue
    if (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift()!;

      // Ghi action vào World
      const actionRequest = this.world.getComponent(
        GLOBAL_ENTITY,
        ActionRequestComponent
      )!;
      actionRequest.request = action;

      // Chạy tất cả các system để xử lý action này
      console.log(`%cProcessing Action: ${action.type}`, "color: #2980B9");
      for (const system of this.systems) {
        system.update(this.world);
      }

      // Xóa request ngay sau khi xử lý xong
      actionRequest.request = null;
    } else {
      // 2. Nếu không có action, mới chạy các system tự động
      for (const system of this.systems) {
        system.update(this.world);
      }
    }
    // =====================================

    this.notifyUpdate(); // Báo cho UI render lại sau khi TẤT CẢ system đã chạy xong
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  public notifyUpdate() {
    if (this.world) {
      this.updateListeners.forEach((listener) => listener(this.world!));
    }
  }
}

const gameManager = new GameManager();
export default gameManager;
