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

  const globalState = draftWorld.getComponent<GlobalStateComponent>(
    GLOBAL_ENTITY,
    "GlobalState"
  );
  const sideEffects = draftWorld.getComponent<SideEffectComponent>(
    GLOBAL_ENTITY,
    "SideEffect"
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
  const cardToPlayInfo = draftWorld.getComponent<CardInfoComponent>(
    entityId,
    "CardInfo"
  );
  const cardToPlayZone = draftWorld.getComponent<ZoneComponent>(
    entityId,
    "Zone"
  );
  const lrigZoneEntities = draftWorld
    .query(["Zone"])
    .filter(
      (e) =>
        draftWorld.getComponent<ZoneComponent>(e, "Zone")!.zone === "lrigZone"
    );
  const centerLrigEntity = lrigZoneEntities.find(
    (e) => draftWorld.getComponent<ZoneComponent>(e, "Zone")!.index === 1
  );

  if (!cardToPlayInfo || cardToPlayZone?.zone !== "hand" || !centerLrigEntity) {
    console.error("Yêu cầu đặt SIGNI không hợp lệ.");
    return;
  }
  const centerLrigInfo = draftWorld.getComponent<CardInfoComponent>(
    centerLrigEntity,
    "CardInfo"
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
    .query(["Zone"])
    .filter(
      (e) =>
        draftWorld.getComponent<ZoneComponent>(e, "Zone")!.zone === "signiZone"
    );
  const currentTotalLevel = signiOnField.reduce((sum, entity) => {
    return (
      sum +
      (draftWorld.getComponent<CardInfoComponent>(entity, "CardInfo")!.data
        .level ?? 0)
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
  const cardToPlayStatus = draftWorld.getComponent<StatusComponent>(
    entityId,
    "Status"
  )!;

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
