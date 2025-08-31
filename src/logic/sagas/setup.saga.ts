// src/logic/sagas/setup.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { Entity } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";

// START_SETUP Saga - Không cần saga riêng vì logic đã trong reducer

// CONFIRM_LRIG_SELECTION Saga
export const confirmLrigSelectionSaga: Saga<{
  type: "CONFIRM_LRIG_SELECTION";
  payload: { center: Entity; assists: Entity[] };
}> = (action, world, { eventBus }) => {
  const { center, assists } = action.payload;

  // Phát sự kiện cards drawn
  eventBus.dispatch(GameEvent.CARD_DRAWN, {
    drawnEntities: getHandEntities(world),
    player: "player1", // Hoặc lấy từ context
  });
};

// CONFIRM_MULLIGAN Saga
export const confirmMulliganSaga: Saga<{
  type: "CONFIRM_MULLIGAN";
  payload: { entities: Entity[] };
}> = (action, world, { gameManager }) => {
  const { entities } = action.payload;

  if (entities.length > 0) {
    // Phát sự kiện mulligan
    // Có thể thêm logic phức tạp hơn ở đây nếu cần
  }

  // Khởi động vòng lặp tự động cho các phase đầu tiên
  gameManager.startLoop();
};

// Helper function
function getHandEntities(world: World): Entity[] {
  return world
    .query([ZoneComponent])
    .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "hand");
}

// Import ZoneComponent for helper
import { ZoneComponent } from "../ecs/components/card.components";
