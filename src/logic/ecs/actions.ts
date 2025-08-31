// src/logic/ecs/actions.ts
import gameManager from "./game.manager";
import { Entity } from "./ecs.types";
import { GLOBAL_ENTITY } from "./game.factory";
import {
  GlobalStateComponent,
  ActionRequestComponent,
} from "./components/card.components";
import { GameAction } from "../core/actions.types"; // <-- IMPORT

export function dispatchChargeEnerAction(
  source: "hand" | "signi",
  entityId: number
) {
  const action: GameAction = {
    type: "CHARGE_ENER",
    payload: { source, entityId },
  };
  gameManager.queueAction(action);
}

// === ACTION MỚI ===
export function dispatchStartSetupAction() {
  const action: GameAction = {
    type: "START_SETUP",
    payload: {},
  };
  gameManager.queueAction(action);
}

export function dispatchAdvancePhaseAction() {
  const action: GameAction = {
    type: "ADVANCE_PHASE",
    payload: {},
  };
  gameManager.queueAction(action);
}

export function dispatchConfirmLrigSelectionAction(
  center: number,
  assists: number[]
) {
  const action: GameAction = {
    type: "CONFIRM_LRIG_SELECTION",
    payload: { center, assists },
  };
  gameManager.queueAction(action);
}

/**
 * Cập nhật danh sách các lá bài được chọn để mulligan.
 * @param selection - Mảng các Entity ID đã được chọn.
 */
export function dispatchUpdateMulliganSelection(selection: Entity[]) {
  const action: GameAction = {
    type: "UPDATE_MULLIGAN_SELECTION",
    payload: { selection },
  };
  gameManager.queueAction(action);
}

/**
 * Xác nhận lựa chọn mulligan và tiến hành đổi bài.
 */
export function dispatchConfirmMulliganAction() {
  const world = gameManager.world;
  if (!world) return;
  const globalState = world.getComponent<GlobalStateComponent>(
    GLOBAL_ENTITY,
    "GlobalState"
  );
  const entities = globalState ? globalState.mulliganSelection : [];
  const action: GameAction = {
    type: "CONFIRM_MULLIGAN",
    payload: { entities },
  };
  gameManager.queueAction(action);
}

export function dispatchGrowLrigAction(
  targetEntityId: number,
  zoneIndex: number
) {
  const action: GameAction = {
    type: "GROW_LRIG",
    payload: { targetEntityId, zoneIndex },
  };
  gameManager.queueAction(action);
}

export function dispatchPlaceSigniAction(entityId: number, zoneIndex: number) {
  const action: GameAction = {
    type: "PLACE_SIGNI",
    payload: { entityId, zoneIndex },
  };
  gameManager.queueAction(action);
}

export function dispatchDiscardCardAction(entityId: number) {
  const action: GameAction = {
    type: "DISCARD_CARD",
    payload: { entityId },
  };
  gameManager.queueAction(action);
}
