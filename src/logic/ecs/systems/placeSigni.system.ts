// src/logic/ecs/systems/placeSigni.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
// import useGameStore from "@/store/gameStore";
import eventBus, { GameEvent } from "@/logic/core/event.bus";

export class PlaceSigniSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );

    if (
      !globalState ||
      !actionRequest ||
      actionRequest.request?.type !== "PLACE_SIGNI"
    ) {
      return;
    }

    console.log("--- Running PlaceSigniSystem ---");
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;
    const { entityId, zoneIndex } = actionRequest.request.payload;

    // --- 1. KIỂM TRA ĐIỀU KIỆN ---
    if (globalState.phase !== "main") {
      sideEffects.queue.push({
        type: "LOG",
        message: "Chỉ có thể đặt SIGNI trong Main Phase.",
        logType: "info",
      });
      return;
    }

    // Lấy thông tin cần thiết
    const cardToPlayInfo = world.getComponent(entityId, CardInfoComponent);
    const cardToPlayZone = world.getComponent(entityId, ZoneComponent);
    const lrigZoneEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "lrigZone");
    const centerLrigEntity = lrigZoneEntities.find(
      (e) => world.getComponent(e, ZoneComponent)!.index === 1
    );

    if (
      !cardToPlayInfo ||
      cardToPlayZone?.zone !== "hand" ||
      !centerLrigEntity
    ) {
      console.error("Yêu cầu đặt SIGNI không hợp lệ.");
      return;
    }
    const centerLrigInfo = world.getComponent(
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
    const signiOnField = world
      .query([ZoneComponent])
      .filter(
        (e) => world.getComponent(e, ZoneComponent)!.zone === "signiZone"
      );
    const currentTotalLevel = signiOnField.reduce((sum, entity) => {
      return (
        sum + (world.getComponent(entity, CardInfoComponent)!.data.level ?? 0)
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
    const cardToPlayStatus = world.getComponent(entityId, StatusComponent)!;

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

    // === PHÁT SỰ KIỆN ===
    eventBus.dispatch(GameEvent.CARD_PLAYED, {
      entityId,
      cardId: cardToPlayInfo.data.id,
      zone: "signiZone",
      zoneIndex,
    });
  }
}
