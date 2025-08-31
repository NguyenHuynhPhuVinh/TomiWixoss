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
  const globalState = draftWorld.getComponent<GlobalStateComponent>(
    GLOBAL_ENTITY,
    "GlobalState"
  );
  const sideEffects = draftWorld.getComponent<SideEffectComponent>(
    GLOBAL_ENTITY,
    "SideEffect"
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
  const targetLrigInfo = draftWorld.getComponent<CardInfoComponent>(
    targetEntityId,
    "CardInfo"
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
  const currentLrigEntity = draftWorld.query(["Zone"]).find((e) => {
    const zone = draftWorld.getComponent<ZoneComponent>(e, "Zone")!;
    return zone.zone === "lrigZone" && zone.index === zoneIndex;
  });

  if (!currentLrigEntity) {
    console.error("LRIG không hợp lệ để Grow.");
    return;
  }
  const currentLrigInfo = draftWorld.getComponent<CardInfoComponent>(
    currentLrigEntity,
    "CardInfo"
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
    const centerLrigEntity = draftWorld.query(["Zone"]).find((e) => {
      const zone = draftWorld.getComponent<ZoneComponent>(e, "Zone")!;
      return zone.zone === "lrigZone" && zone.index === 1;
    });
    if (centerLrigEntity) {
      const centerLrigInfo = draftWorld.getComponent<CardInfoComponent>(
        centerLrigEntity,
        "CardInfo"
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
    .query(["Zone"])
    .filter(
      (e) =>
        draftWorld.getComponent<ZoneComponent>(e, "Zone")!.zone === "enerZone"
    );
  const enerZoneCards = enerZoneEntities.map(
    (e) =>
      draftWorld.getComponent<CardInfoComponent>(e, "CardInfo")!
        .data as CardInstance
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
        (
          draftWorld.getComponent<CardInfoComponent>(e, "CardInfo")!
            .data as CardInstance
        ).uuid === paidCard.uuid
    )!;
    const zone = draftWorld.getComponent<ZoneComponent>(paidEntity, "Zone")!;
    zone.zone = "trash";
  });

  // Thực hiện Grow và xử lý Underneath
  const currentLrigStatus = draftWorld.getComponent<StatusComponent>(
    currentLrigEntity,
    "Status"
  )!;
  const currentLrigZone = draftWorld.getComponent<ZoneComponent>(
    currentLrigEntity,
    "Zone"
  )!;
  const currentLrigUnderneath = draftWorld.getComponent<UnderneathComponent>(
    currentLrigEntity,
    "Underneath"
  );

  // Gom tất cả các lá bài cũ lại
  const oldCardsStack: Entity[] = [
    currentLrigEntity,
    ...(currentLrigUnderneath?.entities ?? []),
  ];

  // Di chuyển các lá bài cũ ra khỏi bàn đấu (tạm thời)
  oldCardsStack.forEach((entityId) => {
    const zone = draftWorld.getComponent<ZoneComponent>(entityId, "Zone")!;
    zone.zone = "underneath"; // Một "zone" ảo
  });

  // Đặt LRIG mới ra sân
  const targetLrigZone = draftWorld.getComponent<ZoneComponent>(
    targetEntityId,
    "Zone"
  )!;
  const targetLrigStatus = draftWorld.getComponent<StatusComponent>(
    targetEntityId,
    "Status"
  )!;
  targetLrigZone.zone = "lrigZone";
  targetLrigZone.index = zoneIndex;
  targetLrigStatus.isFaceUp = true;

  // Gắn component Underneath mới vào LRIG mới
  draftWorld.addComponent(
    targetEntityId,
    "Underneath",
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
