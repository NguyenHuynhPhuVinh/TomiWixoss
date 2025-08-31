// src/logic/reducers/discard.reducer.ts
import { World } from "../ecs/world";
import { Reducer } from "../core/reducer.types";
import { Entity } from "../ecs/ecs.types";
import {
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../ecs/components/card.components";
import { GLOBAL_ENTITY } from "../ecs/game.factory";

export const discardCardReducer: Reducer<{
  type: "DISCARD_CARD";
  payload: { entityId: Entity };
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;

  if (!globalState) return;

  const { entityId } = payload;

  // Di chuyển lá bài vào mộ
  const zone = draftWorld.getComponent(entityId, ZoneComponent)!;
  zone.zone = "trash";

  const cardInfo = draftWorld.getComponent(entityId, CardInfoComponent)!;
  sideEffects.queue.push({
    type: "LOG",
    message: `Bỏ bài: ${cardInfo.data.name}.`,
    logType: "action",
  });

  // Kiểm tra lại sau khi bỏ
  const handSize = draftWorld
    .query([ZoneComponent])
    .filter(
      (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "hand"
    ).length;
  if (handSize <= 6) {
    sideEffects.queue.push({
      type: "UPDATE_UI_FLAG",
      flag: "mustDiscard",
      value: false,
    });
  }
};
