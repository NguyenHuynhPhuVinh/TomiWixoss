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
  // ... các state toàn cục khác

  constructor(initialState: GameState) {
    this.turn = initialState.turn;
    this.phase = initialState.phase;
    this.player = new Player(initialState.player, "Player 1");
    this.ai = new Player(initialState.ai, "AI");
    this.actionTakenInPhase = initialState.actionTakenInPhase;
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
