// src/logic/sagas/ener.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { Entity } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";
import { CardInfoComponent } from "../ecs/components/card.components";

export const chargeEnerSaga: Saga<{
  type: "CHARGE_ENER";
  payload: { source: "hand" | "signi"; entityId: Entity };
}> = (action, world, { eventBus }) => {
  const { source, entityId } = action.payload;

  const cardInfo = world.getComponent<CardInfoComponent>(entityId, "CardInfo")!;

  // PHÁT SỰ KIỆN
  eventBus.dispatch(GameEvent.CARD_CHARGED, {
    entityId,
    source,
    cardId: cardInfo.data.id,
  });
};
