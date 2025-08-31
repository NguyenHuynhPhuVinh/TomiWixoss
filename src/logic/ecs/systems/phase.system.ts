// src/logic/ecs/systems/phase.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  ZoneComponent,
  SideEffectComponent,
  EffectStackComponent, // Import EffectStackComponent
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { TURN_PHASES, GamePhase } from "@/types/game";
import { GameEvent } from "@/logic/core/events.types";
import { produce } from "immer";

const AUTO_ADVANCE_PHASES: GamePhase[] = ["up", "draw"]; // Remove 'ener' as it requires player action or timeout
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

  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;
  }

  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );
    const effectStack = world.getComponent(GLOBAL_ENTITY, EffectStackComponent); // Get the effect stack

    if (!globalState || !actionRequest || !effectStack) return; // Add guard for effectStack

    const isProcessingAction = !!actionRequest.request;
    const isStackEmpty = effectStack.stack.length === 0; // Check if the stack is empty

    // 1. Logic tự động (chỉ chạy khi game idle)
    if (
      !isProcessingAction &&
      AUTO_ADVANCE_PHASES.includes(globalState.phase) &&
      globalState.actionTakenInPhase &&
      isStackEmpty // <-- ADD THIS CRITICAL CHECK
    ) {
      this.advancePhase(globalState, world);
      return;
    }

    // 2. Logic theo yêu cầu (chỉ chạy khi có action)
    if (actionRequest.request?.type === "ADVANCE_PHASE") {
      // Also prevent manual advance if stack is not empty
      if (!isStackEmpty) {
        const sideEffects = world.getComponent(
          GLOBAL_ENTITY,
          SideEffectComponent
        )!;
        sideEffects.queue.push({
          type: "LOG",
          message: "Không thể chuyển phase khi hiệu ứng đang chờ xử lý.",
          logType: "system",
        });
        return;
      }
      this.advancePhase(globalState, world);
    }
  }

  private advancePhase(globalState: GlobalStateComponent, world: World): void {
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;
    const currentPhase = globalState.phase;
    const currentPhaseIndex = TURN_PHASES.indexOf(currentPhase);
    let nextPhaseIndex = currentPhaseIndex + 1;

    if (globalState.turn === 1 && currentPhase === "main") {
      nextPhaseIndex = TURN_PHASES.indexOf("end");
    }

    if (nextPhaseIndex >= TURN_PHASES.length) {
      nextPhaseIndex = 0;
      globalState.turn += 1;
    }

    const nextPhase = TURN_PHASES[nextPhaseIndex];
    globalState.phase = nextPhase;
    globalState.actionTakenInPhase = false;

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

    if (INTERACTIVE_PHASES.includes(nextPhase)) {
      console.log(
        `%cGame loop stopped. Waiting for player input in ${nextPhase} phase.`,
        "color: #E67E22"
      );
      this.eventBus.dispatch(GameEvent.STOP_GAME_LOOP, {});
    }

    const phaseText = nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1);
    sideEffects.queue.push({
      type: "LOG",
      message: `Turn ${globalState.turn} - ${phaseText} Phase`,
      logType: "system",
    });

    this.eventBus.dispatch(GameEvent.PHASE_CHANGED, {
      from: currentPhase,
      to: nextPhase,
      turn: globalState.turn,
    });
  }
}
