// src/logic/reducers/enerCharge.reducer.ts
import { World } from "../ecs/world";
import { Reducer } from "../core/reducer.types";
import { Entity } from "../ecs/ecs.types";
import {
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  CardInfoComponent,
  SideEffectComponent,
} from "../ecs/components/card.components";
import { GLOBAL_ENTITY } from "../ecs/game.factory";

export const enerChargeReducer: Reducer<{
  type: "ENER_CHARGE";
  payload: { amount: number; player: "player" | "ai" };
}> = (draftWorld, payload) => {
  const { amount, player } = payload;

  // Tìm các lá bài trong mainDeck của player
  const deckEntities = draftWorld
    .query(["CardInfo", "Zone", "Status"])
    .filter((entityId: Entity) => {
      const zone = draftWorld.getComponent<ZoneComponent>(entityId, "Zone");
      return zone?.zone === "mainDeck" && zone.owner === player;
    });

  if (deckEntities.length < amount) {
    console.warn(
      `Not enough cards in deck to charge ${amount} ener. Only ${deckEntities.length} cards available.`
    );
    return;
  }

  // Lấy amount lá bài trên cùng của deck
  const cardsToCharge = deckEntities.slice(0, amount);

  // Di chuyển chúng vào enerZone
  for (const entityId of cardsToCharge) {
    const zone = draftWorld.getComponent<ZoneComponent>(entityId, "Zone")!;
    const status = draftWorld.getComponent<StatusComponent>(
      entityId,
      "Status"
    )!;
    const cardInfo = draftWorld.getComponent<CardInfoComponent>(
      entityId,
      "CardInfo"
    )!;

    zone.zone = "enerZone";
    status.isFaceUp = true;

    console.log(`Charged ${cardInfo.data.name} to Ener Zone.`);
  }

  // Log side effect
  const sideEffects = draftWorld.getComponent<SideEffectComponent>(
    GLOBAL_ENTITY,
    "SideEffect"
  )!;
  sideEffects.queue.push({
    type: "LOG",
    message: `Ener Charge ${amount}: Moved ${amount} cards from deck to Ener Zone.`,
    logType: "action",
  });
};
