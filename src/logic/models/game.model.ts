// src/logic/models/game.model.ts
import { GamePhase, GameState, TURN_PHASES } from "@/store/types";
import { Player } from "./player.model";
import eventService, { GameEvent } from "../core/event.service";

export class Game {
  public turn: number;
  public phase: GamePhase;
  public player: Player;
  public ai: Player;
  public actionTakenInPhase: boolean; // State này thuộc về game tổng thể
  public mustDiscard: boolean; // <-- THÊM LẠI STATE NÀY

  constructor(initialState: GameState) {
    this.turn = initialState.turn;
    this.phase = initialState.phase;
    this.player = new Player(initialState.player, "Player 1");
    this.ai = new Player(initialState.ai, "AI");
    this.actionTakenInPhase = initialState.actionTakenInPhase;
    this.mustDiscard = initialState.mustDiscard; // <-- GÁN GIÁ TRỊ BAN ĐẦU
  }

  public getCurrentPlayer(): Player {
    // Tạm thời luôn trả về player chính
    return this.player;
  }

  /**
   * Chuyển sang phase tiếp theo trong lượt.
   */
  public advancePhase(): void {
    const currentPhaseIndex = TURN_PHASES.indexOf(this.phase);
    let nextPhaseIndex = currentPhaseIndex + 1;
    let newTurn = this.turn;

    // Bỏ qua Attack Phase ở lượt đầu tiên của người chơi đầu tiên
    if (this.turn === 1 && this.phase === "main") {
      nextPhaseIndex = TURN_PHASES.indexOf("end");
    }

    if (nextPhaseIndex >= TURN_PHASES.length) {
      nextPhaseIndex = 0;
      newTurn += 1;
    }

    const oldPhase = this.phase;
    this.phase = TURN_PHASES[nextPhaseIndex];
    this.turn = newTurn;
    this.actionTakenInPhase = false; // Reset cờ khi chuyển phase

    eventService.dispatch(GameEvent.PHASE_CHANGED, {
      from: oldPhase,
      to: this.phase,
      turn: this.turn,
    });
  }
}
