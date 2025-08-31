// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { System, SystemDependencies } from "./ecs.types";
import { GLOBAL_ENTITY } from "./game.factory";
import {
  ActionRequestComponent,
  SideEffectComponent,
  EffectStackComponent,
  GlobalStateComponent,
} from "./components/card.components";
import useGameStore from "@/store/gameStore";
import eventBus from "../core/event.bus";
import { GameEvent } from "../core/events.types";
import { GameAction } from "../core/actions.types"; // <-- IMPORT
import { produce } from "immer"; // <-- IMPORT IMMER
import { effectResolverMap } from "./effects.map";

// XÓA: Import tất cả các system - chúng sẽ được đăng ký từ bên ngoài
// import { SetupSystem } from "./systems/setup.system";
// import { EnerSystem } from "./systems/ener.system";
// import { GrowSystem } from "./systems/grow.system";
// import { PlaceSigniSystem } from "./systems/placeSigni.system";
// import { DiscardSystem } from "./systems/discard.system";
// import { UpSystem } from "./systems/up.system";
// import { DrawSystem } from "./systems/draw.system";
// import { PhaseSystem } from "./systems/phase.system";

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
    // XÓA: Không đăng ký system ở đây nữa - sẽ được làm từ bên ngoài
    return this.world;
  }

  // Thêm phương thức đăng ký system
  public registerSystem(system: System): void {
    this.systems.push(system);
  }

  // Khởi tạo các system sau khi đã đăng ký xong
  public initializeSystems(): void {
    const dependencies: SystemDependencies = { eventBus, gameManager: this };
    for (const system of this.systems) {
      system.setup?.(dependencies);
    }

    // Đăng ký listener cho các event hệ thống
    eventBus.on(GameEvent.STOP_GAME_LOOP, () => {
      this.stopLoop();
    });
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
    if (!this.world || !this.isLooping) {
      this.notifyUpdate();
      return;
    }

    // === TOÀN BỘ LOGIC LOOP BÂY GIỜ NẰM TRONG PRODUCE ===
    const nextWorldState = produce(this.world, (draftWorld) => {
      const globalState = draftWorld.getComponent(
        GLOBAL_ENTITY,
        GlobalStateComponent
      )!;
      const effectStack = draftWorld.getComponent(
        GLOBAL_ENTITY,
        EffectStackComponent
      )!;
      const actionRequest = draftWorld.getComponent(
        GLOBAL_ENTITY,
        ActionRequestComponent
      )!;

      // 1. Ưu tiên xử lý Stack
      if (effectStack.stack.length > 0) {
        globalState.engineState = "RESOLVING_STACK";

        // TODO: Logic hỏi người chơi có muốn phản ứng không

        const effectToResolve = effectStack.stack.pop()!;
        console.log(
          `%cRESOLVING EFFECT: ${effectToResolve.type}`,
          "color: #1ABC9C",
          effectToResolve.payload
        );

        const resolver = effectResolverMap[effectToResolve.type];
        if (resolver) {
          // resolver bây giờ sẽ thay đổi trực tiếp trên `draftWorld`
          resolver.resolve(draftWorld as World, effectToResolve.payload);
        } else {
          console.warn(
            `No resolver found for effect type: ${effectToResolve.type}`
          );
        }
      }
      // 2. Nếu Stack rỗng, xử lý Action Queue
      else if (this.actionQueue.length > 0) {
        globalState.engineState = "IDLE";
        const action = this.actionQueue.shift()!;
        console.log(`%cProcessing Action: ${action.type}`, "color: #2980B9");

        actionRequest.request = action;

        // Chạy các system để xử lý action.
        // Các system này bây giờ thay đổi trực tiếp trên draftWorld
        for (const system of this.systems) {
          system.update(draftWorld as World);
        }

        actionRequest.request = null; // Dọn dẹp request sau khi xử lý
      }
      // 3. Nếu không có gì cả, chạy các system tự động
      else {
        globalState.engineState = "IDLE";

        // Chạy các system tự động
        for (const system of this.systems) {
          system.update(draftWorld as World);
        }
      }
    });
    // ===================================================

    this.world = nextWorldState;
    this.processSideEffects(); // Vẫn cần chạy sau khi world mới được tạo
    this.notifyUpdate();
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  public notifyUpdate() {
    if (this.world) {
      this.updateListeners.forEach((listener) => listener(this.world!));
    }
  }

  private processSideEffects(): void {
    // TODO: Implement side effects processing
  }
}

const gameManager = new GameManager();
export default gameManager;
