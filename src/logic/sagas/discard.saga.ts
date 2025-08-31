// src/logic/sagas/discard.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { Entity } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";
import { CardInfoComponent } from "../ecs/components/card.components";

export const discardCardSaga: Saga<{
  type: "DISCARD_CARD";
  payload: { entityId: Entity };
}> = (action, world, { eventBus }) => {
  const { entityId } = action.payload;

  const cardInfo = world.getComponent<CardInfoComponent>(entityId, "CardInfo")!;

  // PHÁT SỰ KIỆN BỎ BÀI
  eventBus.dispatch(GameEvent.CARD_DISCARDED, {
    entityId,
    cardId: cardInfo.data.id,
  });
};
