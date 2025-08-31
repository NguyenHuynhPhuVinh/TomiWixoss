// src/logic/sagas/placeSigni.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { Entity } from "../ecs/ecs.types";
import { CardInfoComponent } from "../ecs/components/card.components";
import { GameEvent } from "../core/events.types";

type PlaceSigniPayload = {
  entityId: Entity;
  zoneIndex: number;
};

export const placeSigniSaga: Saga<{
  type: "PLACE_SIGNI";
  payload: PlaceSigniPayload;
}> = (action, world, { eventBus }) => {
  const { entityId, zoneIndex } = action.payload;
  const cardInfo = world.getComponent<CardInfoComponent>(entityId, "CardInfo")!;

  // Phát event
  eventBus.dispatch(GameEvent.CARD_PLAYED, {
    entityId,
    cardId: cardInfo.data.id,
    zone: "signiZone",
    zoneIndex,
  });
};
