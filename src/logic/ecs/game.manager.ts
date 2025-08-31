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
import { GameAction, GameActionType } from "../core/actions.types"; // <-- IMPORT
import { produce } from "immer"; // <-- IMPORT IMMER
import { effectResolverMap } from "./effects.map";
import { Reducer, Saga } from "../core/reducer.types";

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

  // Phân loại systems
  private actionSystems: System[] = [];
  private loopSystems: System[] = [];
  private systems: System[] = [];

  // Thêm reducers và sagas
  private reducers: Map<GameActionType, Reducer<any>[]> = new Map();
  private sagas: Map<GameActionType, Saga<any>[]> = new Map();

  public createNewGame(): World {
    this.world = this.factory.createNewGame();
    // XÓA: Không đăng ký system ở đây nữa - sẽ được làm từ bên ngoài
    return this.world;
  }

  // Thêm phương thức đăng ký system
  public registerSystem(system: System, type: "action" | "loop"): void {
    if (type === "action") {
      this.actionSystems.push(system);
    } else {
      this.loopSystems.push(system);
    }
  }

  // Thêm phương thức đăng ký reducer
  public registerReducer<T extends GameAction>(
    actionType: T["type"],
    reducer: Reducer<T>
  ) {
    if (!this.reducers.has(actionType)) this.reducers.set(actionType, []);
    this.reducers.get(actionType)!.push(reducer as Reducer<any>);
  }

  // Thêm phương thức đăng ký saga
  public registerSaga<T extends GameAction>(
    actionType: T["type"],
    saga: Saga<T>
  ) {
    if (!this.sagas.has(actionType)) this.sagas.set(actionType, []);
    this.sagas.get(actionType)!.push(saga as Saga<any>);
  }

  // Khởi tạo các system sau khi đã đăng ký xong
  public initializeSystems(): void {
    const dependencies: SystemDependencies = { eventBus, gameManager: this };
    for (const system of [...this.actionSystems, ...this.loopSystems]) {
      system.setup?.(dependencies);
    }

    this.systems = [...this.actionSystems, ...this.loopSystems];

    // Đăng ký listener cho các event hệ thống
    eventBus.on(GameEvent.STOP_GAME_LOOP, () => {
      this.stopLoop();
    });
  }

  // Thêm phương thức khởi tạo dependencies cho sagas
  public initializeDependencies(): SystemDependencies {
    return { eventBus, gameManager: this };
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

    let nextWorldState = this.world;
    const effectStack = nextWorldState.getComponent(
      GLOBAL_ENTITY,
      EffectStackComponent
    )!;

    // --- LOGIC VÒNG LẶP MỚI, TUẦN TỰ TUYỆT ĐỐI ---

    // Ưu tiên 1: Xử lý MỘT hiệu ứng từ Stack
    if (effectStack.stack.length > 0) {
      nextWorldState = produce(nextWorldState, (draftWorld) => {
        const stack = draftWorld.getComponent(
          GLOBAL_ENTITY,
          EffectStackComponent
        )!.stack;
        const effectToResolve = stack.pop()!;
        console.log(
          `%cRESOLVING EFFECT: ${effectToResolve.type}`,
          "color: #1ABC9C",
          effectToResolve.payload
        );

        const resolver = effectResolverMap[effectToResolve.type];
        if (resolver) {
          resolver.resolve(draftWorld as World, effectToResolve.payload);
        } else {
          console.warn(
            `No resolver found for effect type: ${effectToResolve.type}`
          );
        }
      });
    }
    // Ưu tiên 2: (Nếu Stack rỗng) Xử lý MỘT hành động từ Queue
    else if (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift()!;
      console.log(`%cProcessing Action: ${action.type}`, "color: #2980B9");

      // 1. CHẠY REDUCER
      let worldAfterReducer = produce(nextWorldState, (draftWorld) => {
        const actionReducers = this.reducers.get(action.type);
        if (actionReducers) {
          for (const reducer of actionReducers) {
            reducer(draftWorld as World, action.payload);
          }
        }
      });
      nextWorldState = worldAfterReducer;

      // 2. CHẠY SAGAS
      const actionSagas = this.sagas.get(action.type);
      if (actionSagas) {
        const dependencies = this.initializeDependencies();
        for (const saga of actionSagas) {
          (saga as Saga<any>)(action, nextWorldState, dependencies);
        }
      }
    }
    // Ưu tiên 3: (Nếu cả hai đều rỗng) Chạy các system tự động
    else {
      nextWorldState = produce(nextWorldState, (draftWorld) => {
        for (const system of this.systems) {
          system.update(draftWorld as World);
        }
      });
    }
    // ===========================================

    this.world = nextWorldState;
    this.processSideEffects();
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
