// src/logic/reducers/grow.reducer.ts
import { World } from "../ecs/world";
import { Reducer } from "../core/reducer.types";
import { Entity } from "../ecs/ecs.types";
import {
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  UnderneathComponent,
  SideEffectComponent,
} from "../ecs/components/card.components";
import { GLOBAL_ENTITY } from "../ecs/game.factory";
import { checkCost } from "@/logic/payment";
import { CardInstance, CardCost } from "@/types/game";

export const growLrigReducer: Reducer<{
  type: "GROW_LRIG";
  payload: { targetEntityId: Entity; zoneIndex: number };
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

  const { targetEntityId, zoneIndex } = payload;

  // Đóng modal ngay lập tức để đảm bảo phản hồi UI
  sideEffects.queue.push({
    type: "UPDATE_UI_FLAG",
    flag: "isZoneViewerOpen",
    value: false,
  });

  // Lấy dữ liệu targetLrigInfo sớm
  const targetLrigInfo = draftWorld.getComponent(
    targetEntityId,
    CardInfoComponent
  );
  if (!targetLrigInfo) {
    console.error("LRIG không hợp lệ để Grow.");
    return;
  }

  // --- 1. KIỂM TRA ĐIỀU KIỆN (Nâng cấp) ---
  // A. Kiểm tra Phase và timing
  const isCenterGrow = zoneIndex === 1;
  if (isCenterGrow) {
    if (globalState.phase !== "grow" || globalState.actionTakenInPhase) {
      sideEffects.queue.push({
        type: "LOG",
        message: "Chỉ có thể Grow Center LRIG một lần trong Grow Phase.",
        logType: "info",
      });
      return;
    }
  } else {
    // Assist LRIG
    const enterAbility = targetLrigInfo.data.abilities?.find(
      (a) => a.type === "Enter"
    );
    const allowedTimings = enterAbility?.timing;

    if (!allowedTimings || !allowedTimings.includes(globalState.phase as any)) {
      sideEffects.queue.push({
        type: "LOG",
        message: `Không thể Grow ${targetLrigInfo.data.name} trong ${globalState.phase} phase.`,
        logType: "info",
      });
      return;
    }
  }

  // B. Lấy dữ liệu các lá bài liên quan
  const currentLrigEntity = draftWorld.query([ZoneComponent]).find((e) => {
    const zone = draftWorld.getComponent(e, ZoneComponent)!;
    return zone.zone === "lrigZone" && zone.index === zoneIndex;
  });

  if (!currentLrigEntity) {
    console.error("LRIG không hợp lệ để Grow.");
    return;
  }
  const currentLrigInfo = draftWorld.getComponent(
    currentLrigEntity,
    CardInfoComponent
  )!;

  // C. Kiểm tra luật Grow (level, type, etc.)
  if (
    targetLrigInfo.data.level !== (currentLrigInfo.data.level ?? -1) + 1 ||
    targetLrigInfo.data.lrigType !== currentLrigInfo.data.lrigType
  ) {
    sideEffects.queue.push({
      type: "LOG",
      message: "Mục tiêu Grow không hợp lệ.",
      logType: "info",
    });
    return;
  }

  // === C. THÊM KIỂM TRA VỚI CENTER LRIG CHO ASSIST GROW ===
  if (!isCenterGrow) {
    const centerLrigEntity = draftWorld.query([ZoneComponent]).find((e) => {
      const zone = draftWorld.getComponent(e, ZoneComponent)!;
      return zone.zone === "lrigZone" && zone.index === 1;
    });
    if (centerLrigEntity) {
      const centerLrigInfo = draftWorld.getComponent(
        centerLrigEntity,
        CardInfoComponent
      )!;
      const centerLrigLevel = centerLrigInfo.data.level ?? 0;
      const targetLevel = targetLrigInfo.data.level ?? 0;

      if (targetLevel > centerLrigLevel) {
        sideEffects.queue.push({
          type: "LOG",
          message: `Không thể Grow Assist LRIG: Level (${targetLevel}) cao hơn Center LRIG (${centerLrigLevel}).`,
          logType: "info",
        });
        return;
      }
    }
  }

  // --- 2. THANH TOÁN COST ---
  const enerZoneEntities = draftWorld
    .query([ZoneComponent])
    .filter(
      (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "enerZone"
    );
  const enerZoneCards = enerZoneEntities.map(
    (e) => draftWorld.getComponent(e, CardInfoComponent)!.data as CardInstance
  );

  const cost = targetLrigInfo.data.growCost;
  const paymentResult = checkCost(cost, enerZoneCards);

  if (!paymentResult.canPay) {
    sideEffects.queue.push({
      type: "LOG",
      message: "Không thể Grow: Không đủ Ener.",
      logType: "info",
    });
    return;
  }

  // --- 3. THỰC THI HÀNH ĐỘNG (Nâng cấp) ---

  // Trừ Ener
  paymentResult.paidEner.forEach((paidCard: CardInstance) => {
    const paidEntity = enerZoneEntities.find(
      (e) =>
        (draftWorld.getComponent(e, CardInfoComponent)!.data as CardInstance)
          .uuid === paidCard.uuid
    )!;
    const zone = draftWorld.getComponent(paidEntity, ZoneComponent)!;
    zone.zone = "trash";
  });

  // Thực hiện Grow và xử lý Underneath
  const currentLrigStatus = draftWorld.getComponent(
    currentLrigEntity,
    StatusComponent
  )!;
  const currentLrigZone = draftWorld.getComponent(
    currentLrigEntity,
    ZoneComponent
  )!;
  const currentLrigUnderneath = draftWorld.getComponent(
    currentLrigEntity,
    UnderneathComponent
  );

  // Gom tất cả các lá bài cũ lại
  const oldCardsStack: Entity[] = [
    currentLrigEntity,
    ...(currentLrigUnderneath?.entities ?? []),
  ];

  // Di chuyển các lá bài cũ ra khỏi bàn đấu (tạm thời)
  oldCardsStack.forEach((entityId) => {
    const zone = draftWorld.getComponent(entityId, ZoneComponent)!;
    zone.zone = "underneath"; // Một "zone" ảo
  });

  // Đặt LRIG mới ra sân
  const targetLrigZone = draftWorld.getComponent(
    targetEntityId,
    ZoneComponent
  )!;
  const targetLrigStatus = draftWorld.getComponent(
    targetEntityId,
    StatusComponent
  )!;
  targetLrigZone.zone = "lrigZone";
  targetLrigZone.index = zoneIndex;
  targetLrigStatus.isFaceUp = true;

  // Gắn component Underneath mới vào LRIG mới
  draftWorld.addComponent(
    targetEntityId,
    new UnderneathComponent(oldCardsStack)
  );

  // --- 4. CẬP NHẬT STATE VÀ LOG ---
  if (isCenterGrow) {
    // Chỉ set cờ khi Grow Center LRIG
    globalState.actionTakenInPhase = true;
  }
  sideEffects.queue.push({
    type: "LOG",
    message: `Trả ${paymentResult.paidEner.length} Ener.`,
    logType: "cost",
  });
  sideEffects.queue.push({
    type: "LOG",
    message: `Grow LRIG thành ${targetLrigInfo.data.name}!`,
    logType: "action",
  });
};
