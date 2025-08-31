// src/logic/sagas/grow.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { Entity } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";
import { CardInfoComponent } from "../ecs/components/card.components";

export const growLrigSaga: Saga<{
  type: "GROW_LRIG";
  payload: { targetEntityId: Entity; zoneIndex: number };
}> = (action, world, { eventBus }) => {
  const { targetEntityId, zoneIndex } = action.payload;

  const targetLrigInfo = world.getComponent(targetEntityId, CardInfoComponent)!;

  // PHÁT SỰ KIỆN CHO GROW
  eventBus.dispatch(GameEvent.CARD_GROWN, {
    entityId: targetEntityId,
    cardId: targetLrigInfo.data.id,
    zoneIndex,
  });
};
