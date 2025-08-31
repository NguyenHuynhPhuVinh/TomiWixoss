// src/logic/reducers/placeSigni.reducer.ts
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

type PlaceSigniPayload = {
  entityId: Entity;
  zoneIndex: number;
};

export const placeSigniReducer: Reducer<{
  type: "PLACE_SIGNI";
  payload: PlaceSigniPayload;
}> = (draftWorld, payload) => {
  const { entityId, zoneIndex } = payload;

  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;

  // --- 1. KIỂM TRA ĐIỀU KIỆN ---
  if (globalState?.phase !== "main") {
    sideEffects.queue.push({
      type: "LOG",
      message: "Chỉ có thể đặt SIGNI trong Main Phase.",
      logType: "info",
    });
    return;
  }

  // Lấy thông tin cần thiết
  const cardToPlayInfo = draftWorld.getComponent(entityId, CardInfoComponent);
  const cardToPlayZone = draftWorld.getComponent(entityId, ZoneComponent);
  const lrigZoneEntities = draftWorld
    .query([ZoneComponent])
    .filter(
      (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "lrigZone"
    );
  const centerLrigEntity = lrigZoneEntities.find(
    (e) => draftWorld.getComponent(e, ZoneComponent)!.index === 1
  );

  if (!cardToPlayInfo || cardToPlayZone?.zone !== "hand" || !centerLrigEntity) {
    console.error("Yêu cầu đặt SIGNI không hợp lệ.");
    return;
  }
  const centerLrigInfo = draftWorld.getComponent(
    centerLrigEntity,
    CardInfoComponent
  )!;

  // A. Kiểm tra Level
  if ((cardToPlayInfo.data.level ?? 0) > (centerLrigInfo.data.level ?? 0)) {
    sideEffects.queue.push({
      type: "LOG",
      message: `Không thể đặt SIGNI: Level quá cao (yêu cầu <= ${centerLrigInfo.data.level}).`,
      logType: "info",
    });
    return;
  }

  // B. Kiểm tra Limit
  const signiOnField = draftWorld
    .query([ZoneComponent])
    .filter(
      (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "signiZone"
    );
  const currentTotalLevel = signiOnField.reduce((sum, entity) => {
    return (
      sum +
      (draftWorld.getComponent(entity, CardInfoComponent)!.data.level ?? 0)
    );
  }, 0);
  const lrigLimit =
    typeof centerLrigInfo.data.limit === "number"
      ? centerLrigInfo.data.limit
      : 99;

  if (currentTotalLevel + (cardToPlayInfo.data.level ?? 0) > lrigLimit) {
    sideEffects.queue.push({
      type: "LOG",
      message: `Không thể đặt SIGNI: Vượt quá giới hạn Level trên sân (Limit: ${lrigLimit}).`,
      logType: "info",
    });
    return;
  }

  // --- 2. THỰC THI HÀNH ĐỘNG ---
  const cardToPlayStatus = draftWorld.getComponent(entityId, StatusComponent)!;

  cardToPlayZone.zone = "signiZone";
  cardToPlayZone.index = zoneIndex;
  cardToPlayStatus.isFaceUp = true;

  sideEffects.queue.push({
    type: "LOG",
    message: `Đặt SIGNI: ${cardToPlayInfo.data.name} vào vị trí ${
      zoneIndex + 1
    }.`,
    logType: "action",
  });
};
