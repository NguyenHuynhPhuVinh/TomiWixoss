// src/logic/ecs/systems/phase.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  ZoneComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { TURN_PHASES, GamePhase } from "@/types/game";
import useGameStore from "@/store/gameStore";
import gameManager from "../game.manager"; // <-- IMPORT GameManager

// Các phase sẽ tự động chuyển tiếp nếu hành động đã xong
const AUTO_ADVANCE_PHASES: GamePhase[] = ["up", "draw"];
// Các phase mà game sẽ dừng lại và chờ người chơi
const INTERACTIVE_PHASES: GamePhase[] = [
  "ener",
  "grow",
  "main",
  "attack",
  "end",
  "selecting_lrigs",
  "mulligan",
];

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
      this.advancePhase(globalState, world);
      return; // Dừng lại sau khi đã chuyển phase
    }

    // --- LOGIC CHUYỂN PHASE THEO YÊU CẦU (TỪ NÚT BẤM) ---
    if (actionRequest.request?.type === "ADVANCE_PHASE") {
      // Bỏ "anh gác cổng"
      console.log(`--- Advancing from ${globalState.phase} by request ---`);
      this.advancePhase(globalState, world);
      actionRequest.request = null; // Dọn dẹp yêu cầu
    }
  }

  /**
   * Helper function chứa logic chuyển phase
   */
  private advancePhase(globalState: GlobalStateComponent, world: World): void {
    const { addLog, setMustDiscard } = useGameStore.getState();
    const currentPhaseIndex = TURN_PHASES.indexOf(globalState.phase);
    let nextPhaseIndex = currentPhaseIndex + 1;

    if (globalState.turn === 1 && globalState.phase === "main") {
      nextPhaseIndex = TURN_PHASES.indexOf("end");
    }

    if (nextPhaseIndex >= TURN_PHASES.length) {
      nextPhaseIndex = 0;
      globalState.turn += 1;
    }

    const nextPhase = TURN_PHASES[nextPhaseIndex];
    globalState.phase = nextPhase;
    globalState.actionTakenInPhase = false; // Luôn reset cho phase mới

    // === DI CHUYỂN LOGIC KIỂM TRA END PHASE VÀO ĐÂY ===
    if (nextPhase === "end") {
      const handEntities = world
        .query([ZoneComponent])
        .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "hand");

      if (handEntities.length > 6) {
        const amountToDiscard = handEntities.length - 6;
        addLog(
          `Tay bài có ${handEntities.length} lá. Phải bỏ ${amountToDiscard} lá.`,
          "system"
        );
        setMustDiscard(true); // Cập nhật state UI ngay lập tức
      }
    }
    // =================================================

    // === LOGIC ĐIỀU KHIỂN VÒNG LẶP MỚI ===
    // Nếu phase tiếp theo là một phase tương tác, hãy dừng vòng lặp
    if (INTERACTIVE_PHASES.includes(globalState.phase)) {
      console.log(
        `%cGame loop stopped. Waiting for player input in ${globalState.phase} phase.`,
        "color: #E67E22"
      );
      gameManager.stopLoop();
    }
    // =====================================

    const phaseText =
      globalState.phase.charAt(0).toUpperCase() + globalState.phase.slice(1);
    addLog(`Turn ${globalState.turn} - ${phaseText} Phase`, "system");
  }
}
