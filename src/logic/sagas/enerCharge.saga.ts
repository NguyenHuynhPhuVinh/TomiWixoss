// src/logic/sagas/enerCharge.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";

export const enerChargeSaga: Saga<{
  type: "ENER_CHARGE";
  payload: { amount: number; player: "player" | "ai" };
}> = (action, world, { eventBus }) => {
  // Saga chỉ biết về ý định, không biết kết quả.
  // Log sẽ được tạo ra bởi Reducer, nơi có kết quả thực tế.
  // Saga này có thể không cần thiết nữa nếu nó chỉ ghi log.
  // Hoặc nó có thể phát ra sự kiện.
  // const { eventBus: eb } = { eventBus };
  // eb.dispatch(GameEvent.CARD_CHARGED, { /* ... */ });
  // Không trả về side effect nào
};
