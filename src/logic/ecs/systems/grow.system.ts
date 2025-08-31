// src/logic/ecs/systems/grow.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import useGameStore from "@/store/gameStore";
import { checkCost } from "@/logic/payment";
import { CardInstance } from "@/types/game";

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

    // --- 1. KIỂM TRA ĐIỀU KIỆN ---
    // A. Kiểm tra Phase và cờ actionTaken
    const isGrowPhaseAction =
      globalState.phase === "grow" && !globalState.actionTakenInPhase;
    const isMainOrAttackPhaseAction = ["main", "attack"].includes(
      globalState.phase
    );

    if (!isGrowPhaseAction && !isMainOrAttackPhaseAction) {
      addLog("Không thể Grow ở phase này.", "info");
      actionRequest.request = null;
      return;
    }

    // B. Lấy dữ liệu các lá bài liên quan
    const targetLrigInfo = world.getComponent(
      targetEntityId,
      CardInfoComponent
    );
    const currentLrigEntity = world.query([ZoneComponent]).find((e) => {
      const zone = world.getComponent(e, ZoneComponent)!;
      return zone.zone === "lrigZone" && zone.index === zoneIndex;
    });

    if (!targetLrigInfo || !currentLrigEntity) {
      console.error("LRIG không hợp lệ để Grow.");
      actionRequest.request = null;
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
      actionRequest.request = null;
      return;
    }

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
      actionRequest.request = null;
      return;
    }

    // --- 3. THỰC THI HÀNH ĐỘNG ---
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

    // Thực hiện Grow
    const currentLrigZone = world.getComponent(
      currentLrigEntity,
      ZoneComponent
    )!;
    currentLrigZone.zone = "lrigTrash"; // Chuyển LRIG cũ vào mộ

    const targetLrigZone = world.getComponent(targetEntityId, ZoneComponent)!;
    const targetLrigStatus = world.getComponent(
      targetEntityId,
      StatusComponent
    )!;
    targetLrigZone.zone = "lrigZone";
    targetLrigZone.index = zoneIndex;
    targetLrigStatus.isFaceUp = true;

    // --- 4. CẬP NHẬT STATE VÀ LOG ---
    if (globalState.phase === "grow") {
      globalState.actionTakenInPhase = true;
    }

    addLog(`Trả ${paymentResult.paidEner.length} Ener.`, "cost");
    addLog(`Grow LRIG thành ${targetLrigInfo.data.name}!`, "action");

    // Dọn dẹp yêu cầu
    actionRequest.request = null;
  }
}
