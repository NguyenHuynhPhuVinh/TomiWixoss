// src/logic/actions.miniplex.ts

import { world, globalEntity } from "./ecs/world.miniplex";
import { Entity } from "./ecs/types.miniplex";
import { TURN_PHASES } from "@/types/game";

/**
 * Hành động: Nạp một lá bài vào Ener Zone.
 * Gom logic của chargeEnerReducer và chargeEnerSaga.
 * @param entityUuid - UUID của lá bài cần nạp.
 */
export function chargeEnerAction(entityUuid: string) {
  const { globalState, sideEffectQueue } = globalEntity;

  if (globalState?.phase !== "ener" || globalState.actionTakenInPhase) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      message: "Bây giờ không thể nạp Ener.",
      logType: "info",
    });
    return;
  }

  // Tìm entity trong world bằng UUID của nó
  // `archetype` là một cách query hiệu quả khác của Miniplex
  const entities = world.with("uuid", "zone", "status", "cardInfo");
  let entityToCharge: Entity | undefined;
  for (const e of entities) {
    if (e.uuid === entityUuid) {
      entityToCharge = e;
      break;
    }
  }

  if (
    !entityToCharge ||
    !entityToCharge.zone ||
    !entityToCharge.status ||
    !entityToCharge.cardInfo
  ) {
    console.error(
      `Entity ${entityUuid} không tồn tại hoặc thiếu component để nạp ener.`
    );
    return;
  }

  const source = entityToCharge.zone.zone === "hand" ? "tay" : "sân";

  // --- Logic từ Reducer cũ được chuyển vào đây ---
  entityToCharge.zone.zone = "enerZone";
  entityToCharge.status.isFaceUp = true;

  // Đánh dấu đã thực hiện hành động
  globalState.actionTakenInPhase = true;

  // --- Logic từ Saga cũ cũng được chuyển vào đây ---
  sideEffectQueue?.queue.push({
    type: "LOG",
    message: `Nạp Ener từ ${source}: ${entityToCharge.cardInfo.data.name}.`,
    logType: "action",
  });
}

/**
 * Hành động: Bỏ một lá bài vào mộ.
 * Gom logic của discardCardReducer.
 * @param entityUuid - UUID của lá bài cần bỏ.
 */
export function discardCardAction(entityUuid: string) {
  const { globalState, sideEffectQueue } = globalEntity;

  // Tìm entity trong world
  const entities = world.with("uuid", "zone", "status", "cardInfo");
  let entityToDiscard: Entity | undefined;
  for (const e of entities) {
    if (e.uuid === entityUuid) {
      entityToDiscard = e;
      break;
    }
  }

  if (
    !entityToDiscard ||
    !entityToDiscard.zone ||
    !entityToDiscard.status ||
    !entityToDiscard.cardInfo
  ) {
    console.error(
      `Entity ${entityUuid} không tồn tại hoặc thiếu component để bỏ bài.`
    );
    return;
  }

  // Di chuyển lá bài vào mộ
  entityToDiscard.zone.zone = "trash";

  // Log action
  sideEffectQueue?.queue.push({
    type: "LOG",
    message: `Bỏ bài: ${entityToDiscard.cardInfo.data.name}.`,
    logType: "action",
  });

  // Kiểm tra lại hand size
  const handEntities = world.with("zone");
  let handCount = 0;
  for (const e of handEntities) {
    if (e.zone?.zone === "hand") {
      handCount++;
    }
  }
  if (handCount <= 6) {
    sideEffectQueue?.queue.push({
      type: "UPDATE_UI_FLAG",
      flag: "mustDiscard",
      value: false,
    });
  }
}

/**
 * Hành động: Chuyển sang phase tiếp theo.
 * Gom logic của advancePhaseReducer.
 */
export function advancePhaseAction() {
  const { globalState, sideEffectQueue } = globalEntity;
  if (!globalState) return;

  const currentPhase = globalState.phase;
  const currentIndex = TURN_PHASES.indexOf(currentPhase);
  let nextIndex = currentIndex + 1;

  // Logic chuyển turn
  if (nextIndex >= TURN_PHASES.length) {
    nextIndex = 0; // Quay về Up Phase
    globalState.turn += 1;
  }

  const nextPhase = TURN_PHASES[nextIndex];
  globalState.phase = nextPhase;
  globalState.actionTakenInPhase = false; // Reset cờ cho phase mới

  sideEffectQueue?.queue.push({
    type: "LOG",
    message: `Bắt đầu ${nextPhase} Phase. (Turn ${globalState.turn})`,
    logType: "system",
  });
}

/**
 * Hành động: Toggle lựa chọn mulligan cho một lá bài.
 * @param entityUuid - UUID của lá bài cần toggle.
 */
export function updateMulliganSelectionAction(entityUuid: string) {
  const { globalState } = globalEntity;

  if (globalState?.phase !== "mulligan") {
    console.warn("Không thể cập nhật mulligan selection ngoài phase mulligan.");
    return;
  }

  const currentSelection = globalState.mulliganSelection || [];
  const isSelected = currentSelection.includes(entityUuid);

  if (isSelected) {
    // Bỏ chọn
    globalState.mulliganSelection = currentSelection.filter(
      (uuid) => uuid !== entityUuid
    );
  } else {
    // Chọn thêm
    globalState.mulliganSelection = [...currentSelection, entityUuid];
  }
}
