// src/logic/commands/discardCard.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";
import { CardInstance } from "@/types/game";

export class DiscardCardCommand implements ICommand {
  constructor(private cardUuid: string) {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    if (!game) return false;

    // Điều kiện: đúng phase, và lá bài phải có trên tay
    return (
      game.phase === "end" &&
      !!game.player.hand.find((c: CardInstance) => c.uuid === this.cardUuid)
    );
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;

    const game = get().game!;
    const player = game.player;

    const cardIndex = player.hand.findIndex(
      (c: CardInstance) => c.uuid === this.cardUuid
    );
    if (cardIndex === -1) return;

    const cardToDiscard = player.hand.splice(cardIndex, 1)[0];
    cardToDiscard.isFaceUp = true;
    player.trash.push(cardToDiscard);

    get().addLog(`Bỏ bài: ${cardToDiscard.name}.`, "action");

    // === THAY THẾ LOGIC CŨ ===
    // Sau khi bỏ bài, kiểm tra lại điều kiện và cập nhật trực tiếp vào model
    if (player.hand.length <= 6) {
      game.mustDiscard = false;
    }
    // Xóa dòng: useGameStore.getState().setMustDiscard(mustDiscard);
    // ========================

    useGameStore.getState().updateGame(game);
  }
}
