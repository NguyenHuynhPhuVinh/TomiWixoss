// src/logic/ecs/systems/grow.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import { Entity } from "../ecs.types";
import {
  ActionRequestComponent,
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  UnderneathComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import useGameStore from "@/store/gameStore";
import { checkCost } from "@/logic/payment";
import { CardInstance } from "@/types/game";
import { GamePhase } from "@/types/game";
import eventBus, { GameEvent } from "@/logic/core/event.bus";

export class GrowSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );

    if (
      !globalState ||
      !actionRequest ||
      actionRequest.request?.type !== "GROW_LRIG"
    ) {
      return;
    }

    const { addLog, closeZoneViewer } = useGameStore.getState();
    const { targetEntityId, zoneIndex } = actionRequest.request.payload;

    // Đóng modal ngay lập tức để đảm bảo phản hồi UI
    closeZoneViewer();

    // Lấy dữ liệu targetLrigInfo sớm
    const targetLrigInfo = world.getComponent(
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
        addLog("Chỉ có thể Grow Center LRIG một lần trong Grow Phase.", "info");
        return;
      }
    } else {
      // Assist LRIG
      const enterAbility = targetLrigInfo.data.abilities?.find(
        (a) => a.type === "Enter"
      );
      const allowedTimings = enterAbility?.timing;

      if (
        !allowedTimings ||
        !allowedTimings.includes(globalState.phase as any)
      ) {
        addLog(
          `Không thể Grow ${targetLrigInfo.data.name} trong ${globalState.phase} phase.`,
          "info"
        );
        return;
      }
    }

    // B. Lấy dữ liệu các lá bài liên quan
    const currentLrigEntity = world.query([ZoneComponent]).find((e) => {
      const zone = world.getComponent(e, ZoneComponent)!;
      return zone.zone === "lrigZone" && zone.index === zoneIndex;
    });

    if (!currentLrigEntity) {
      console.error("LRIG không hợp lệ để Grow.");
      return;
    }
    const currentLrigInfo = world.getComponent(
      currentLrigEntity,
      CardInfoComponent
    )!;

    // C. Kiểm tra luật Grow (level, type, etc.)
    // (Thêm lại các luật chi tiết ở đây sau)
    if (
      targetLrigInfo.data.level !== (currentLrigInfo.data.level ?? -1) + 1 ||
      targetLrigInfo.data.lrigType !== currentLrigInfo.data.lrigType
    ) {
      addLog("Mục tiêu Grow không hợp lệ.", "info");
      return;
    }

    // === C. THÊM KIỂM TRA VỚI CENTER LRIG CHO ASSIST GROW ===
    if (!isCenterGrow) {
      const centerLrigEntity = world.query([ZoneComponent]).find((e) => {
        const zone = world.getComponent(e, ZoneComponent)!;
        return zone.zone === "lrigZone" && zone.index === 1;
      });
      if (centerLrigEntity) {
        const centerLrigInfo = world.getComponent(
          centerLrigEntity,
          CardInfoComponent
        )!;
        const centerLrigLevel = centerLrigInfo.data.level ?? 0;
        const targetLevel = targetLrigInfo.data.level ?? 0;

        if (targetLevel > centerLrigLevel) {
          addLog(
            `Không thể Grow Assist LRIG: Level (${targetLevel}) cao hơn Center LRIG (${centerLrigLevel}).`,
            "info"
          );
          return;
        }
      }
    }
    // ======================================================

    // --- 2. THANH TOÁN COST ---
    const enerZoneEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "enerZone");
    const enerZoneCards = enerZoneEntities.map(
      (e) => world.getComponent(e, CardInfoComponent)!.data as CardInstance
    );

    const cost = targetLrigInfo.data.growCost;
    const paymentResult = checkCost(cost, enerZoneCards);

    if (!paymentResult.canPay) {
      addLog("Không thể Grow: Không đủ Ener.", "info");
      return;
    }

    // --- 3. THỰC THI HÀNH ĐỘNG (Nâng cấp) ---
    console.log("--- Running GrowSystem ---");

    // Trừ Ener
    paymentResult.paidEner.forEach((paidCard) => {
      const paidEntity = enerZoneEntities.find(
        (e) =>
          (world.getComponent(e, CardInfoComponent)!.data as CardInstance)
            .uuid === paidCard.uuid
      )!;
      const zone = world.getComponent(paidEntity, ZoneComponent)!;
      zone.zone = "trash";
    });

    // Thực hiện Grow và xử lý Underneath
    const currentLrigStatus = world.getComponent(
      currentLrigEntity,
      StatusComponent
    )!;
    const currentLrigZone = world.getComponent(
      currentLrigEntity,
      ZoneComponent
    )!;
    const currentLrigUnderneath = world.getComponent(
      currentLrigEntity,
      UnderneathComponent
    );

    // Gom tất cả các lá bài cũ lại
    const oldCardsStack: Entity[] = [
      currentLrigEntity,
      ...(currentLrigUnderneath?.entities ?? []),
    ];

    // Di chuyển các lá bài cũ ra khỏi bàn đấu (tạm thời)
    // Thay vì vào mộ, chúng ta chỉ thay đổi zone của chúng
    oldCardsStack.forEach((entityId) => {
      const zone = world.getComponent(entityId, ZoneComponent)!;
      zone.zone = "underneath"; // Một "zone" ảo
    });

    // Đặt LRIG mới ra sân
    const targetLrigZone = world.getComponent(targetEntityId, ZoneComponent)!;
    const targetLrigStatus = world.getComponent(
      targetEntityId,
      StatusComponent
    )!;
    targetLrigZone.zone = "lrigZone";
    targetLrigZone.index = zoneIndex;
    targetLrigStatus.isFaceUp = true;

    // Gắn component Underneath mới vào LRIG mới
    world.addComponent(targetEntityId, new UnderneathComponent(oldCardsStack));

    // --- 4. CẬP NHẬT STATE VÀ LOG ---
    if (isCenterGrow) {
      // Chỉ set cờ khi Grow Center LRIG
      globalState.actionTakenInPhase = true;
    }
    addLog(`Trả ${paymentResult.paidEner.length} Ener.`, "cost");
    addLog(`Grow LRIG thành ${targetLrigInfo.data.name}!`, "action");

    // PHÁT SỰ KIỆN CHO GROW
    eventBus.dispatch(GameEvent.CARD_GROWN, {
      targetEntityId,
      newCardId: targetLrigInfo.data.id,
    });
  }
}
