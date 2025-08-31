// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { System, SystemDependencies } from "./ecs.types";
import { GLOBAL_ENTITY } from "./game.factory";
import {
  ActionRequestComponent,
  SideEffectComponent,
} from "./components/card.components";
import useGameStore from "@/store/gameStore";
import eventBus from "../core/event.bus";
import { GameEvent } from "../core/events.types";
import { GameAction } from "../core/actions.types"; // <-- IMPORT

// Import tất cả các system
import { SetupSystem } from "./systems/setup.system";
import { EnerSystem } from "./systems/ener.system";
import { GrowSystem } from "./systems/grow.system";
import { PlaceSigniSystem } from "./systems/placeSigni.system";
import { DiscardSystem } from "./systems/discard.system";
import { UpSystem } from "./systems/up.system";
import { DrawSystem } from "./systems/draw.system";
import { PhaseSystem } from "./systems/phase.system";

type UpdateListener = (world: World) => void;

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private animationFrameId: number = 0;

  private actionQueue: GameAction[] = [];

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
    // Các system tự động ở dưới
    this.systems.push(new UpSystem());
    this.systems.push(new DrawSystem());
    this.systems.push(new PhaseSystem());

    // Tiêm dependency cho tất cả các system có hàm setup
    const dependencies: SystemDependencies = { eventBus, gameManager };
    for (const system of this.systems) {
      system.setup?.(dependencies);
    }

    // Đăng ký listener cho các event hệ thống
    eventBus.on(GameEvent.STOP_GAME_LOOP, () => {
      this.stopLoop();
    });

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

  public queueAction(action: GameAction): void {
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
      this.notifyUpdate();
      return;
    }

    // 1. Lấy action (nếu có) và đặt vào request
    const action = this.actionQueue.shift();
    const actionRequest = this.world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    )!;
    actionRequest.request = action || null;
    if (action) {
      console.log(`%cProcessing Action: ${action.type}`, "color: #2980B9");
    }

    // 2. Chạy tất cả các system MỘT LẦN DUY NHẤT
    for (const system of this.systems) {
      system.update(this.world);
    }

    // BƯỚC CUỐI CÙNG TRONG LOOP
    this.processSideEffects();

    this.notifyUpdate();
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  private processSideEffects() {
    if (!this.world) return;
    const sideEffectComponent = this.world.getComponent(
      GLOBAL_ENTITY,
      SideEffectComponent
    )!;

    // Xử lý tất cả các yêu cầu trong hàng đợi
    while (sideEffectComponent.queue.length > 0) {
      const effect = sideEffectComponent.queue.shift()!;
      const { addLog, setMustDiscard, openZoneViewer } =
        useGameStore.getState();

      switch (effect.type) {
        case "LOG":
          addLog(effect.message, effect.logType);
          break;
        case "UPDATE_UI_FLAG":
          if (effect.flag === "mustDiscard") {
            setMustDiscard(effect.value);
          }
          if (effect.flag === "isZoneViewerOpen") {
            if (effect.value) openZoneViewer();
            // else closeZoneViewer() // Cần thêm action này
          }
          break;
      }
    }
  }

  public notifyUpdate() {
    if (this.world) {
      this.updateListeners.forEach((listener) => listener(this.world!));
    }
  }
}

const gameManager = new GameManager();
export default gameManager;
