// src/logic/commands/advancePhase.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";

export class AdvancePhaseCommand implements ICommand {
  constructor() {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    // Tạm thời cho phép chuyển phase bất cứ lúc nào (trừ setup)
    return !!game && game.phase !== "pre_game" && game.phase !== "mulligan";
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;
    const game = get().game!;

    // Lấy tên phase mới TRƯỚC khi thay đổi để log
    const oldPhase = game.phase;
    game.advancePhase();
    const newPhase = game.phase;

    // Log sự kiện chuyển phase (đã được xử lý bên trong advancePhase qua event)
    const phaseText = newPhase.charAt(0).toUpperCase() + newPhase.slice(1);
    get().addLog(`Turn ${game.turn} - ${phaseText} Phase`, "system");

    useGameStore.getState().updateGame(game);
  }
}
