// src/logic/reducers/sideEffect.reducer.ts
import { Reducer } from "../core/reducer.types";
import {
  SideEffect,
  SideEffectComponent,
} from "../ecs/components/card.components";
import { GLOBAL_ENTITY } from "../ecs/game.factory";

export const queueSideEffectReducer: Reducer<{
  type: "QUEUE_SIDE_EFFECT";
  payload: { effect: SideEffect };
}> = (draftWorld, payload) => {
  const sideEffectComponent = draftWorld.getComponent<SideEffectComponent>(
    GLOBAL_ENTITY,
    "SideEffect"
  )!;
  sideEffectComponent.queue.push(payload.effect);
};
