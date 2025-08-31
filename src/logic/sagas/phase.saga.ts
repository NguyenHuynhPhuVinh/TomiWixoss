// src/logic/sagas/phase.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";
import { GLOBAL_ENTITY } from "../ecs/game.factory";
import { GlobalStateComponent } from "../ecs/components/card.components";
import { GamePhase, TURN_PHASES } from "@/types/game";

// Các phase tương tác
const INTERACTIVE_PHASES: GamePhase[] = [
  "ener",
  "grow",
  "main",
  "attack",
  "end",
  "selecting_lrigs",
  "mulligan",
];

// ADVANCE_PHASE Saga
export const advancePhaseSaga: Saga<{
  type: "ADVANCE_PHASE";
  payload: {};
}> = (action, world, { eventBus }) => {
  const globalState = world.getComponent<GlobalStateComponent>(
    GLOBAL_ENTITY,
    "GlobalState"
  )!;
  const currentPhase = globalState.phase;

  // Calculate previous phase
  const currentIndex = TURN_PHASES.indexOf(currentPhase);
  const prevIndex =
    currentIndex === 0 ? TURN_PHASES.length - 1 : currentIndex - 1;
  const prevPhase = TURN_PHASES[prevIndex];

  // Dispatch events
  if (INTERACTIVE_PHASES.includes(currentPhase)) {
    console.log(
      `%cGame loop stopped. Waiting for player input in ${currentPhase} phase.`,
      "color: #E67E22"
    );
    eventBus.dispatch(GameEvent.STOP_GAME_LOOP, {});
  }

  eventBus.dispatch(GameEvent.PHASE_CHANGED, {
    from: prevPhase,
    to: currentPhase,
    turn: globalState.turn,
  });
};
