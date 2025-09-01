// src/logic/sagas/enerCharge.saga.ts
import { World } from "../ecs/world";
import { Saga } from "../core/reducer.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { GameEvent } from "../core/events.types";

export const enerChargeSaga: Saga<{
  type: "ENER_CHARGE";
  payload: { amount: number; player: "player" | "ai" };
}> = (action, world, { eventBus }) => {
  const { amount, player } = action.payload;

  // Có thể phát sự kiện nếu cần, nhưng tạm thời chỉ log
  console.log(`Ener Charge saga: Charged ${amount} cards for ${player}`);
};
