// src/logic/ecs/systems/phase.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { TURN_PHASES, GamePhase } from "@/types/game";
import useGameStore from "@/store/gameStore";

// Các phase sẽ tự động chuyển tiếp nếu hành động đã xong
const AUTO_ADVANCE_PHASES: GamePhase[] = ["up", "draw"];

export class PhaseSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );
    if (!globalState || !actionRequest) return;

    // --- LOGIC TỰ ĐỘNG CHUYỂN PHASE ---
    if (
      AUTO_ADVANCE_PHASES.includes(globalState.phase) &&
      globalState.actionTakenInPhase
    ) {
      console.log(`--- Auto-advancing from ${globalState.phase} ---`);
      this.advancePhase(globalState);
      return; // Dừng lại sau khi đã chuyển phase
    }

    // --- LOGIC CHUYỂN PHASE THEO YÊU CẦU (TỪ NÚT BẤM) ---
    if (actionRequest.request?.type === "ADVANCE_PHASE") {
      // Bỏ "anh gác cổng"
      console.log(`--- Advancing from ${globalState.phase} by request ---`);
      this.advancePhase(globalState);
      actionRequest.request = null; // Dọn dẹp yêu cầu
    }
  }

  /**
   * Helper function chứa logic chuyển phase
   */
  private advancePhase(globalState: GlobalStateComponent): void {
    const { addLog } = useGameStore.getState();
    const currentPhaseIndex = TURN_PHASES.indexOf(globalState.phase);
    let nextPhaseIndex = currentPhaseIndex + 1;

    if (globalState.turn === 1 && globalState.phase === "main") {
      nextPhaseIndex = TURN_PHASES.indexOf("end");
    }

    if (nextPhaseIndex >= TURN_PHASES.length) {
      nextPhaseIndex = 0;
      globalState.turn += 1;
    }

    globalState.phase = TURN_PHASES[nextPhaseIndex];
    globalState.actionTakenInPhase = false; // Luôn reset cho phase mới

    const phaseText =
      globalState.phase.charAt(0).toUpperCase() + globalState.phase.slice(1);
    addLog(`Turn ${globalState.turn} - ${phaseText} Phase`, "system");
  }
}
