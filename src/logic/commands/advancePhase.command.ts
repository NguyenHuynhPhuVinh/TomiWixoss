// src/logic/commands/advancePhase.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";

export class AdvancePhaseCommand implements ICommand {
  constructor() {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    if (!game) return false;

    // Thêm điều kiện: không thể chuyển phase nếu đang phải bỏ bài
    if (game.mustDiscard) {
      get().addLog("Phải bỏ bài cho đến khi còn 6 lá trên tay.", "info");
      return false;
    }

    return game.phase !== "pre_game" && game.phase !== "mulligan";
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;
    const game = get().game!;

    // 1. Thực hiện chuyển phase
    game.advancePhase();

    // 2. Sau khi chuyển phase, kiểm tra xem phase mới có phải là 'end' không
    const player = game.getCurrentPlayer();
    if (game.phase === "end" && player.hand.length > 6) {
      game.mustDiscard = true;
      get().addLog(
        `Tay bài có ${player.hand.length} lá. Phải bỏ ${
          player.hand.length - 6
        } lá.`,
        "system"
      );
    }

    // 3. Log và cập nhật UI
    const phaseText = game.phase.charAt(0).toUpperCase() + game.phase.slice(1);
    get().addLog(`Turn ${game.turn} - ${phaseText} Phase`, "system");

    useGameStore.getState().updateGame(game);
  }
}
