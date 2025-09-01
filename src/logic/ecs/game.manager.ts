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
  SideEffect,
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

export class GameManager {
  // <-- Thêm export ở đây
  public world: World | null = null;
  private factory: GameFactory;
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private animationFrameId: number = 0;

  private actionQueue: GameAction[] = [];

  // Thêm queue cho side effects
  private sideEffectQueue: SideEffect[] = [];

  // Phân loại systems
  private actionSystems: System[] = [];
  private loopSystems: System[] = [];
  private systems: System[] = [];

  // Thêm reducers và sagas
  private reducers: Map<GameActionType, Reducer<any>[]> = new Map();
  private sagas: Map<GameActionType, Saga<any>[]> = new Map();

  // === THÊM REGISTRY MỚI ===
  private componentRegistry: Map<string, any> = new Map();

  constructor() {
    // Tự tiêm chính nó vào factory
    this.factory = new GameFactory(this);
  }

  // === THÊM PHƯƠNG THỨC ĐĂNG KÝ COMPONENT ===
  public registerComponent(name: string, componentClass: any) {
    this.componentRegistry.set(name, componentClass);
  }

  public getComponentClass(name: string): any | undefined {
    return this.componentRegistry.get(name);
  }
  // =========================================

  // Thêm phương thức tạo game mới
  public createNewGame(): World {
    this.world = this.factory.createEmptyWorld();
    return this.world;
  }

  // Thêm phương thức hydrate deck
  public hydrateDeck(
    world: World,
    mainDeckData: any[],
    lrigDeckData: any[]
  ): void {
    this.factory.hydrateDeck(world, mainDeckData, lrigDeckData);
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

  public queueSideEffect(sideEffect: SideEffect): void {
    console.log(
      `%cSIDE EFFECT QUEUED: ${sideEffect.type}`,
      "color: #9B59B6",
      sideEffect
    );
    this.sideEffectQueue.push(sideEffect);
  }

  private loop() {
    if (!this.world || !this.isLooping) {
      this.notifyUpdate();
      return;
    }

    let nextWorldState = this.world;

    // --- LOGIC VÒNG LẶP MỚI, ƯU TIÊN STACK ---

    // 1. XỬ LÝ TOÀN BỘ EFFECT STACK TRƯỚC TIÊN
    // Vòng lặp này đảm bảo stack được dọn sạch trong một "siêu tick"
    while (
      nextWorldState.getComponent<EffectStackComponent>(
        GLOBAL_ENTITY,
        "EffectStack"
      )!.stack.length > 0
    ) {
      nextWorldState = produce(nextWorldState, (draftWorld) => {
        const effectStack = draftWorld.getComponent<EffectStackComponent>(
          GLOBAL_ENTITY,
          "EffectStack"
        )!;
        const effectToResolve = effectStack.stack.pop()!;
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

    // 2. CHỈ KHI STACK RỖNG, MỚI XÉT ĐẾN ACTION HOẶC LOOP SYSTEMS
    const action = this.actionQueue.shift();
    if (action) {
      // Nếu có action, xử lý nó
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

      // 2. CHẠY SAGAS VÀ THU THẬP SIDE EFFECTS
      const sagaSideEffects: SideEffect[] = [];
      const actionSagas = this.sagas.get(action.type);
      if (actionSagas) {
        const dependencies = this.initializeDependencies();
        for (const saga of actionSagas) {
          const effects = saga(action, worldAfterReducer, dependencies);
          if (effects) {
            sagaSideEffects.push(...effects);
          }
        }
      }

      // 3. ÁP DỤNG SIDE EFFECTS VÀO STATE MỚI
      if (sagaSideEffects.length > 0) {
        nextWorldState = produce(worldAfterReducer, (draftWorld) => {
          const sideEffectComponent =
            draftWorld.getComponent<SideEffectComponent>(
              GLOBAL_ENTITY,
              "SideEffect"
            )!;
          sideEffectComponent.queue.push(...sagaSideEffects);
        });
      } else {
        nextWorldState = worldAfterReducer;
      }
    } else {
      // Nếu không có action, chạy các loop systems
      nextWorldState = produce(nextWorldState, (draftWorld) => {
        for (const system of this.loopSystems) {
          system.update(draftWorld as World);
        }
      });
    }

    // Dọn dẹp request sau mỗi tick
    nextWorldState = produce(nextWorldState, (draftWorld) => {
      const actionRequest = draftWorld.getComponent<ActionRequestComponent>(
        GLOBAL_ENTITY,
        "ActionRequest"
      )!;
      actionRequest.request = null;
    });
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
    if (!this.world) return;

    const sideEffectComponent = this.world.getComponent<SideEffectComponent>(
      GLOBAL_ENTITY,
      "SideEffect"
    );
    if (!sideEffectComponent) return;

    // Di chuyển tất cả side effects từ queue vào component
    while (this.sideEffectQueue.length > 0) {
      const sideEffect = this.sideEffectQueue.shift()!;
      sideEffectComponent.queue.push(sideEffect);
    }
  }
}

const gameManager = new GameManager();
export default gameManager;
