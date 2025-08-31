// src/logic/ecs/actions.ts
import gameManager from "./game.manager";
import { GLOBAL_ENTITY } from "./game.factory";
import {
  ActionRequestComponent,
  GlobalStateComponent,
} from "./components/card.components";
import { Entity } from "./ecs.types";

export function dispatchChargeEnerAction(
  source: "hand" | "signi",
  entityId: number
) {
  const world = gameManager.world;
  if (!world) return;

  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  if (actionRequest) {
    actionRequest.request = {
      type: "CHARGE_ENER",
      payload: { source, entityId },
    };
    // Gọi phương thức xử lý hành động mới
    gameManager.handlePlayerAction();
  }
}

// === ACTION MỚI ===
export function dispatchStartSetupAction() {
  const world = gameManager.world;
  if (!world) return;

  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  if (actionRequest) {
    actionRequest.request = {
      type: "START_SETUP",
      payload: null,
    };
    gameManager.handlePlayerAction();
  }
}
export function dispatchAdvancePhaseAction() {
  const world = gameManager.world;
  if (!world) return;

  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  if (actionRequest) {
    actionRequest.request = { type: "ADVANCE_PHASE", payload: null };

    // Xử lý hành động ngay lập tức
    gameManager.handlePlayerAction();

    // Nếu phase tiếp theo là một phase tự động, hãy khởi động lại vòng lặp
    const newPhase = world.getComponent(
      GLOBAL_ENTITY,
      GlobalStateComponent
    )!.phase;
    if (["up", "draw"].includes(newPhase)) {
      gameManager.startLoop();
    }
  }
}

export function dispatchConfirmLrigSelectionAction(
  center: number,
  assists: number[]
) {
  const world = gameManager.world;
  if (!world) return;
  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  if (actionRequest) {
    actionRequest.request = {
      type: "CONFIRM_LRIG_SELECTION",
      payload: { center, assists },
    };
    gameManager.handlePlayerAction();
  }
}

/**
 * Cập nhật danh sách các lá bài được chọn để mulligan.
 * @param selection - Mảng các Entity ID đã được chọn.
 */
export function dispatchUpdateMulliganSelection(selection: Entity[]) {
  const world = gameManager.world;
  if (!world) return;

  const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
  if (globalState) {
    globalState.mulliganSelection = selection;
    // Chỉ cập nhật state, không cần chạy system nên không gọi forceUpdate
    // Nhưng chúng ta cần báo cho UI biết để re-render
    gameManager.notifyUpdate();
  }
}

/**
 * Xác nhận lựa chọn mulligan và tiến hành đổi bài.
 */
export function dispatchConfirmMulliganAction() {
  const world = gameManager.world;
  if (!world) return;

  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);

  if (actionRequest && globalState) {
    actionRequest.request = {
      type: "CONFIRM_MULLIGAN",
      // payload sẽ lấy từ chính globalState.mulliganSelection
      payload: { entities: globalState.mulliganSelection },
    };
    gameManager.handlePlayerAction();
  }
}

export function dispatchGrowLrigAction(
  targetEntityId: number,
  zoneIndex: number
) {
  const world = gameManager.world;
  if (!world) return;

  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  if (actionRequest) {
    actionRequest.request = {
      type: "GROW_LRIG",
      payload: { targetEntityId, zoneIndex },
    };
    gameManager.handlePlayerAction();
  }
}

export function dispatchPlaceSigniAction(entityId: number, zoneIndex: number) {
  const world = gameManager.world;
  if (!world) return;

  const actionRequest = world.getComponent(
    GLOBAL_ENTITY,
    ActionRequestComponent
  );
  if (actionRequest) {
    actionRequest.request = {
      type: "PLACE_SIGNI",
      payload: { entityId, zoneIndex },
    };
    gameManager.handlePlayerAction();
  }
}
