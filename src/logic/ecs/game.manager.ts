// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { UpSystem } from "./systems/up.system";
import { DrawSystem } from "./systems/draw.system";
import { EnerSystem } from "./systems/ener.system"; // <-- IMPORT
import { GrowSystem } from "./systems/grow.system"; // <-- IMPORT
import { PlaceSigniSystem } from "./systems/placeSigni.system"; // <-- IMPORT
import { PhaseSystem } from "./systems/phase.system"; // <-- IMPORT
import { SetupSystem } from "./systems/setup.system"; // <-- IMPORT
import { DiscardSystem } from "./systems/discard.system"; // <-- IMPORT
import { System } from "./ecs.types";
import eventBus, { GameEvent } from "../core/event.bus"; // Import EventBus
import { GLOBAL_ENTITY } from "./game.factory";
import { ActionRequestComponent } from "./components/card.components";

type UpdateListener = (world: World) => void;

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private animationFrameId: number = 0;

  // Action queue + single systems list
  private actionQueue: { type: string; payload?: any }[] = [];
  private systems: System[] = []; // single ordered list of systems

  public createNewGame(): World {
    this.world = this.factory.createNewGame();

    // Build a single ordered list of systems. Order matters.
    this.systems.push(new SetupSystem());
    this.systems.push(new EnerSystem());
    this.systems.push(new GrowSystem());
    this.systems.push(new PlaceSigniSystem());
    this.systems.push(new DiscardSystem());
    // automatic systems
    this.systems.push(new UpSystem());
    this.systems.push(new DrawSystem());
    this.systems.push(new PhaseSystem());

    return this.world;
  }

  public onUpdate(listener: UpdateListener) {
    this.updateListeners.push(listener);
  }

  private loop() {
    if (!this.isLooping || !this.world) return;

    // --- New loop behavior ---
    // In each frame do exactly one of:
    //  - process a single queued action (if any), OR
    //  - run automatic systems when there is no pending action.
    if (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift()!;
      this.processAction(action);
    } else {
      for (const system of this.systems) {
        system.update(this.world);
      }
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
   * Push an action into the queue. Public interface for dispatchers.
   */
  public queueAction(action: { type: string; payload?: any }) {
    console.log(
      `%cACTION QUEUED: ${action.type}`,
      "color: #F39C12",
      action.payload
    );
    this.actionQueue.push(action);
  }

  /**
   * Process a single action by writing it to ActionRequestComponent and running systems.
   */
  private processAction(action: { type: string; payload?: any }) {
    if (!this.world) return;

    // Write the action into the shared ActionRequestComponent so systems can read it.
    const actionRequest = this.world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    )!;
    actionRequest.request = action;

    // When processing an explicit action we still run all systems.
    // Systems that are automatic (Up/Draw/Phase) should guard themselves
    // and not run if an action is actively being processed.
    for (const system of this.systems) {
      system.update(this.world);
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
