// src/logic/ecs/actions.ts
import gameManager from "./game.manager";
import { GLOBAL_ENTITY } from "./game.factory";
import { ActionRequestComponent } from "./components/card.components";

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
    // Sau khi đặt yêu cầu, gọi forceUpdate để System chạy ngay lập-tức
    gameManager.forceUpdate();
  }
}
