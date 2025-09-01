// src/logic/ecs/systems/autoPhase.system.miniplex.ts

import { advancePhaseAction } from "@/logic/actions.miniplex";
import { GamePhase } from "../../constants"; // <-- Import từ constants mới
import { globalEntity } from "../world.miniplex";

// Các phase sẽ tự động chuyển khi hành động hoàn tất
const AUTO_ADVANCE_PHASES: GamePhase[] = [GamePhase.UP, GamePhase.DRAW]; // <-- Sử dụng hằng số

export function autoPhaseSystem() {
  const { globalState } = globalEntity;

  if (!globalState) return;

  // Kiểm tra xem có cần tự động chuyển phase không
  if (
    AUTO_ADVANCE_PHASES.includes(globalState.phase) &&
    globalState.actionTakenInPhase
  ) {
    // Nếu có, gọi hành động chuyển phase
    advancePhaseAction();
  }
}
