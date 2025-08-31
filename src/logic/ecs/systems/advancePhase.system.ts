// src/logic/ecs/systems/advancePhase.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { PhaseSystem } from "./phase.system"; // reuse internal helper if needed
import { TURN_PHASES } from "@/types/game";
// import useGameStore from "@/store/gameStore";
import gameManager from "../game.manager";
import eventBus, { GameEvent } from "@/logic/core/event.bus";
import { ZoneComponent } from "../components/card.components";

export class AdvancePhaseSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );

    if (
      !globalState ||
      !actionRequest ||
      actionRequest.request?.type !== "ADVANCE_PHASE"
    ) {
      return;
    }

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
    globalState.actionTakenInPhase = false;

    // Check end phase hand size rules
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

    // If next phase is interactive, stop the game loop
    const INTERACTIVE_PHASES = [
      "ener",
      "grow",
      "main",
      "attack",
      "end",
      "selecting_lrigs",
      "mulligan",
    ];

    if (INTERACTIVE_PHASES.includes(globalState.phase)) {
      console.log(
        `%cGame loop stopped. Waiting for player input in ${globalState.phase} phase.`,
        "color: #E67E22"
      );
      gameManager.stopLoop();
    }

    const phaseText =
      globalState.phase.charAt(0).toUpperCase() + globalState.phase.slice(1);
    sideEffects.queue.push({
      type: "LOG",
      message: `Turn ${globalState.turn} - ${phaseText} Phase`,
      logType: "system",
    });

    eventBus.dispatch(GameEvent.PHASE_CHANGED, {
      from: TURN_PHASES[currentPhaseIndex],
      to: nextPhase,
      turn: globalState.turn,
    });
  }
}
