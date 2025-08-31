// src/store/slices/phaseSlice.ts
import { StateCreator } from "zustand";
import { GameStore, GamePhase, TURN_PHASES } from "../types";

// Định nghĩa interface cho slice
export interface PhaseSlice {
  phase: GamePhase;
  turn: number;
  actionTakenInPhase: boolean;
  goToNextPhase: () => void;
}

// Hàm tạo slice
export const createPhaseSlice: StateCreator<GameStore, [], [], PhaseSlice> = (
  set,
  get
) => ({
  // State ban đầu
  phase: "pre_game",
  turn: 0,
  actionTakenInPhase: false,

  // Action
  goToNextPhase: () => {
    set((state) => {
      if (state.phase === "pre_game" || state.phase === "mulligan")
        return state;

      const currentPhaseIndex = TURN_PHASES.indexOf(state.phase);
      let nextPhaseIndex = currentPhaseIndex + 1;
      let newTurn = state.turn;

      if (nextPhaseIndex >= TURN_PHASES.length) {
        nextPhaseIndex = 0;
        newTurn += 1;
      }

      const nextPhase = TURN_PHASES[nextPhaseIndex];
      let mustDiscardNow = false;
      if (nextPhase === "end" && state.player.hand.length > 6) {
        mustDiscardNow = true;
      }

      return {
        phase: nextPhase,
        turn: newTurn,
        mustDiscard: mustDiscardNow, // Lưu ý: `mustDiscard` thuộc về PlayerSlice, nhưng logic lại nằm ở đây. Đây là một điểm cần cân nhắc.
        actionTakenInPhase: false,
      };
    });

    // Log ra phase mới sau khi state đã được cập nhật
    const newState = get();
    const phaseText =
      newState.phase.charAt(0).toUpperCase() + newState.phase.slice(1);
    get().addLog(`Turn ${newState.turn} - ${phaseText} Phase`, "system");
  },
});
