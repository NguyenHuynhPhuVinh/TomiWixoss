// src/logic/commands/drawCard.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";
import eventService, { GameEvent } from "../core/event.service";

export class DrawCardCommand implements ICommand {
  constructor() {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    if (!game) return false;
    const player = game.getCurrentPlayer();

    return (
      game.phase === "draw" &&
      !game.actionTakenInPhase &&
      player.mainDeck.length > 0
    );
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;

    const game = get().game!;
    const player = game.getCurrentPlayer();
    const amountToDraw = game.turn === 1 ? 1 : 2;

    // Gọi phương thức từ model
    const drawnCards = player.drawCards(amountToDraw);
    game.actionTakenInPhase = true;

    // Log và phát sự kiện
    get().addLog(`Rút ${drawnCards.length} lá bài.`, "action");
    eventService.dispatch(GameEvent.CARD_DRAWN, {
      count: drawnCards.length,
      player: player.name,
    });

    // Cập nhật UI
    useGameStore.getState().updateGame(game);
  }
}
