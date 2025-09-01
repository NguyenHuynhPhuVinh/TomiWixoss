// src/logic/ecs/systems/endPhase.system.miniplex.ts

import { globalEntity, world } from "../world.miniplex";
import { GamePhase, Zone } from "../../constants"; // <-- Import constants

export function endPhaseSystem() {
  const { globalState, sideEffectQueue } = globalEntity;

  // 1. Chỉ chạy trong End Phase và chỉ chạy MỘT LẦN
  if (
    !globalState ||
    globalState.phase !== GamePhase.END || // <-- Sử dụng hằng số
    globalState.actionTakenInPhase // Dùng cờ này để đảm bảo chỉ kiểm tra 1 lần
  ) {
    return;
  }

  console.log("--- Running EndPhaseSystem (Miniplex) ---");

  // 2. Đếm số lá bài trên tay
  const handEntities = world
    .with("zone")
    .where((e) => e.zone.zone === Zone.HAND); // <-- Sử dụng hằng số
  const handSize = Array.from(handEntities).length;

  // 3. Kiểm tra và tạo side effect nếu cần
  if (handSize > 6) {
    const amountToDiscard = handSize - 6;
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.discardRequired",
      payload: { handSize, discardCount: amountToDiscard },
      logType: "system",
    });
    sideEffectQueue?.queue.push({
      type: "UPDATE_UI_FLAG",
      flag: "mustDiscard",
      value: true,
    });
  }

  // 4. Đánh dấu là đã chạy logic cho phase này
  // Ngăn không cho system này chạy lại ở các frame tiếp theo trong cùng End Phase
  globalState.actionTakenInPhase = true;
}
