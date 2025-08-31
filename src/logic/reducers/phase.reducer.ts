// src/logic/reducers/phase.reducer.ts
import { Reducer } from "../core/reducer.types";
import { TURN_PHASES, GamePhase } from "@/types/game";
import { GLOBAL_ENTITY } from "../ecs/game.factory";
import {
  GlobalStateComponent,
  SideEffectComponent,
  ZoneComponent,
  EffectStackComponent,
} from "../ecs/components/card.components";

// Các phase có hành động bắt buộc
const MANDATORY_ACTION_PHASES: GamePhase[] = ["up", "draw"];

export const advancePhaseReducer: Reducer<{
  type: "ADVANCE_PHASE";
  payload: {};
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  )!;
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;
  const effectStack = draftWorld.getComponent(
    GLOBAL_ENTITY,
    EffectStackComponent
  )!;

  // Kiểm tra effect stack
  if (effectStack.stack.length > 0) {
    sideEffects.queue.push({
      type: "LOG",
      message: "Không thể chuyển phase khi hiệu ứng đang chờ xử lý.",
      logType: "system",
    });
    return;
  }

  // === LOGIC GÁC CỔNG MỚI ===
  // Nếu đang ở một phase bắt buộc VÀ hành động chưa được làm -> không cho qua
  if (
    MANDATORY_ACTION_PHASES.includes(globalState.phase) &&
    !globalState.actionTakenInPhase
  ) {
    sideEffects.queue.push({
      type: "LOG",
      message: "Bạn phải hoàn thành hành động của phase này trước.",
      logType: "info",
    });
    return; // Dừng lại, không chuyển phase
  }
  // ==========================

  // Nếu qua được cổng gác, tiến hành chuyển phase
  const currentPhase = globalState.phase;
  const currentPhaseIndex = TURN_PHASES.indexOf(currentPhase);
  let nextPhaseIndex = currentPhaseIndex + 1;

  if (globalState.turn === 1 && currentPhase === "main") {
    nextPhaseIndex = TURN_PHASES.indexOf("end");
  }

  if (nextPhaseIndex >= TURN_PHASES.length) {
    nextPhaseIndex = 0;
    globalState.turn += 1;
  }

  const nextPhase = TURN_PHASES[nextPhaseIndex];
  globalState.phase = nextPhase;
  globalState.actionTakenInPhase = false; // Luôn reset cho phase mới

  // Thêm side effects cho phase mới
  if (nextPhase === "end") {
    const handEntities = draftWorld
      .query([ZoneComponent])
      .filter(
        (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "hand"
      );

    if (handEntities.length > 6) {
      const amountToDiscard = handEntities.length - 6;
      sideEffects.queue.push({
        type: "LOG",
        message: `Tay bài có ${handEntities.length} lá. Phải bỏ ${amountToDiscard} lá.`,
        logType: "system",
      });
      sideEffects.queue.push({
        type: "UPDATE_UI_FLAG",
        flag: "mustDiscard",
        value: true,
      });
    }
  }

  const phaseText = nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1);
  sideEffects.queue.push({
    type: "LOG",
    message: `Turn ${globalState.turn} - ${phaseText} Phase`,
    logType: "system",
  });
};
