// src/logic/ecs/systems/up.system.miniplex.ts

import { world, globalEntity } from "../world.miniplex";
import { GamePhase, Zone } from "../../constants"; // <-- Import constants

// System bây giờ chỉ là một hàm đơn giản
export function upSystem() {
  const { globalState, sideEffectQueue } = globalEntity;

  // 1. Điều kiện để chạy System (giống hệt cũ)
  if (
    !globalState ||
    globalState.phase !== GamePhase.UP || // <-- Sử dụng hằng số
    globalState.actionTakenInPhase
  ) {
    return;
  }

  console.log("--- Running UpSystem (Miniplex) ---");

  // 2. Truy vấn entity bằng API của Miniplex - Rất dễ đọc!
  // "Lấy cho tôi tất cả entity có cả component 'status' và 'zone'"
  const entitiesToUp = world.with("status", "zone");

  let uppedCardCount = 0;
  for (const entity of entitiesToUp) {
    // 3. Logic xử lý (thay đổi trực tiếp thuộc tính)
    if (
      (entity.zone.zone === Zone.SIGNI_ZONE ||
        entity.zone.zone === Zone.LRIG_ZONE) && // <-- Sử dụng hằng số
      entity.status.isDowned
    ) {
      entity.status.isDowned = false; // <-- Đơn giản là thay đổi thuộc tính!
      uppedCardCount++;
    }
  }

  // 4. Gửi side effect (giống hệt cũ, chỉ khác cách truy cập)
  if (uppedCardCount > 0) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.upPhase.uppedCards",
      payload: { count: uppedCardCount },
      logType: "action",
    });
  } else {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.upPhase.noCards",
      logType: "info",
    });
  }

  // 5. Đánh dấu phase đã hoàn thành
  globalState.actionTakenInPhase = true;
}
