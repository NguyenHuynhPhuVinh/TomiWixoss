// src/logic/ecs/systems/phase.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { TURN_PHASES, GamePhase } from "@/types/game";
import { GameEvent } from "@/logic/core/events.types"; // Import từ file mới
import { produce } from "immer"; // <-- IMPORT IMMER

// Các phase sẽ tự động chuyển tiếp nếu hành động đã xong
const AUTO_ADVANCE_PHASES: GamePhase[] = ["up", "draw", "ener"];
// Các phase mà game sẽ dừng lại và chờ người chơi
const INTERACTIVE_PHASES: GamePhase[] = [
  "ener",
  "grow",
  "main",
  "attack",
  "end",
  "selecting_lrigs",
  "mulligan",
];

export class PhaseSystem implements System {
  private eventBus!: SystemDependencies["eventBus"];

  // Nhận dependency
  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;
  }

  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );
    if (!globalState || !actionRequest) return;

    const isProcessingAction = !!actionRequest.request;

    // 1. Logic tự động (chỉ chạy khi game idle)
    if (
      !isProcessingAction &&
      AUTO_ADVANCE_PHASES.includes(globalState.phase) &&
      globalState.actionTakenInPhase
    ) {
      this.advancePhase(globalState, world);
      return;
    }

    // 2. Logic theo yêu cầu (chỉ chạy khi có action)
    if (actionRequest.request?.type === "ADVANCE_PHASE") {
      this.advancePhase(globalState, world);
    }
  }

  /**
   * Helper function chứa logic chuyển phase
   */
  private advancePhase(globalState: GlobalStateComponent, world: World): void {
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;
    const currentPhaseIndex = TURN_PHASES.indexOf(globalState.phase);
    let nextPhaseIndex = currentPhaseIndex + 1;

    if (globalState.turn === 1 && globalState.phase === "main") {
      nextPhaseIndex = TURN_PHASES.indexOf("end");
    }

    if (nextPhaseIndex >= TURN_PHASES.length) {
      nextPhaseIndex = 0;
      globalState.turn += 1;
    }

    const nextPhase = TURN_PHASES[nextPhaseIndex];
    globalState.phase = nextPhase;
    globalState.actionTakenInPhase = false; // Luôn reset cho phase mới

    // === DI CHUYỂN LOGIC KIỂM TRA END PHASE VÀO ĐÂY ===
    if (nextPhase === "end") {
      const handEntities = world
        .query([ZoneComponent])
        .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "hand");

      if (handEntities.length > 6) {
        const amountToDiscard = handEntities.length - 6;
        sideEffects.queue.push({
          type: "LOG",
          message: `Tay bài có ${handEntities.length} lá. Phải bỏ ${amountToDiscard} lá.`,
          logType: "system",
        });
        sideEffects.queue.push({
          type: "UPDATE_UI_FLAG",
          flag: "mustDiscard",
          value: true,
        });
      }
    }
    // =================================================

    // === LOGIC ĐIỀU KHIỂN VÒNG LẶP MỚI ===
    // Nếu phase tiếp theo là một phase tương tác, hãy dừng vòng lặp
    if (INTERACTIVE_PHASES.includes(globalState.phase)) {
      console.log(
        `%cGame loop stopped. Waiting for player input in ${globalState.phase} phase.`,
        "color: #E67E22"
      );
      // Để dừng vòng lặp, chúng ta sẽ phát ra một sự kiện đặc biệt
      this.eventBus.dispatch(GameEvent.STOP_GAME_LOOP, {});
    }
    // =====================================

    const phaseText =
      globalState.phase.charAt(0).toUpperCase() + globalState.phase.slice(1);
    sideEffects.queue.push({
      type: "LOG",
      message: `Turn ${globalState.turn} - ${phaseText} Phase`,
      logType: "system",
    });

    // PHÁT SỰ KIỆN THÔNG BÁO THAY ĐỔI PHASE
    this.eventBus.dispatch(GameEvent.PHASE_CHANGED, {
      from: TURN_PHASES[currentPhaseIndex],
      to: nextPhase,
      turn: globalState.turn,
    });
  }
}
