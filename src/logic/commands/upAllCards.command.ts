// src/logic/commands/upAllCards.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";

export class UpAllCardsCommand implements ICommand {
  constructor() {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    return !!game && game.phase === "up" && !game.actionTakenInPhase;
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;

    const game = get().game!;
    const player = game.getCurrentPlayer();

    // Gọi phương thức từ model
    player.upAllCards();
    game.actionTakenInPhase = true;

    get().addLog("Up tất cả các lá bài trên sân.", "action");
    useGameStore.getState().updateGame(game);
  }
}
