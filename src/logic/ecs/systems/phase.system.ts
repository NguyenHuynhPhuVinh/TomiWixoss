// src/logic/ecs/systems/phase.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { TURN_PHASES } from "@/store/types"; // Import mảng TURN_PHASES

export class PhaseSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );

    if (
      !globalState ||
      !actionRequest ||
      actionRequest.request?.type !== "ADVANCE_PHASE"
    ) {
      return;
    }

    console.log("--- Running PhaseSystem ---");

    const currentPhaseIndex = TURN_PHASES.indexOf(globalState.phase);
    let nextPhaseIndex = currentPhaseIndex + 1;

    // Xử lý logic bỏ qua Attack Phase ở Lượt 1
    if (globalState.turn === 1 && globalState.phase === "main") {
      nextPhaseIndex = TURN_PHASES.indexOf("end");
    }

    // Xử lý logic chuyển lượt
    if (nextPhaseIndex >= TURN_PHASES.length) {
      nextPhaseIndex = 0;
      globalState.turn += 1; // <-- TĂNG TURN Ở ĐÂY
    }

    // Cập nhật phase mới và reset cờ hành động
    globalState.phase = TURN_PHASES[nextPhaseIndex];
    globalState.actionTakenInPhase = false;

    // Dọn dẹp yêu cầu
    actionRequest.request = null;
  }
}
