// src/logic/ecs/actions.ts
import gameManager from "./game.manager";
import { Entity } from "./ecs.types";
import { GLOBAL_ENTITY } from "./game.factory";
import {
  GlobalStateComponent,
  ActionRequestComponent,
} from "./components/card.components";

export function dispatchChargeEnerAction(
  source: "hand" | "signi",
  entityId: number
) {
  gameManager.queueAction({
    type: "CHARGE_ENER",
    payload: { source, entityId },
  });
}

// === ACTION MỚI ===
export function dispatchStartSetupAction() {
  gameManager.queueAction({ type: "START_SETUP" });
}

export function dispatchAdvancePhaseAction() {
  gameManager.queueAction({ type: "ADVANCE_PHASE" });
}

export function dispatchConfirmLrigSelectionAction(
  center: number,
  assists: number[]
) {
  gameManager.queueAction({
    type: "CONFIRM_LRIG_SELECTION",
    payload: { center, assists },
  });
}

/**
 * Cập nhật danh sách các lá bài được chọn để mulligan.
 * @param selection - Mảng các Entity ID đã được chọn.
 */
export function dispatchUpdateMulliganSelection(selection: Entity[]) {
  // This updates local global state directly and notifies UI.
  const world = gameManager.world;
  if (!world) return;

  const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
  if (globalState) {
    globalState.mulliganSelection = selection;
    gameManager.notifyUpdate();
  }
}

/**
 * Xác nhận lựa chọn mulligan và tiến hành đổi bài.
 */
export function dispatchConfirmMulliganAction() {
  const world = gameManager.world;
  if (!world) return;
  const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
  const entities = globalState ? globalState.mulliganSelection : [];
  gameManager.queueAction({ type: "CONFIRM_MULLIGAN", payload: { entities } });
}

export function dispatchGrowLrigAction(
  targetEntityId: number,
  zoneIndex: number
) {
  gameManager.queueAction({
    type: "GROW_LRIG",
    payload: { targetEntityId, zoneIndex },
  });
}

export function dispatchPlaceSigniAction(entityId: number, zoneIndex: number) {
  gameManager.queueAction({
    type: "PLACE_SIGNI",
    payload: { entityId, zoneIndex },
  });
}

export function dispatchDiscardCardAction(entityId: number) {
  gameManager.queueAction({ type: "DISCARD_CARD", payload: { entityId } });
}
