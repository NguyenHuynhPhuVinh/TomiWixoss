// src/logic/commands/placeSigni.command.ts
import { ICommand, GameStoreGet } from "./command.interface"; // Không cần Set nữa
import useGameStore from "@/store/gameStore";
import eventService, { GameEvent } from "../core/event.service";
import { CardInstance } from "@/types/game";

export class PlaceSigniCommand implements ICommand {
  constructor(private cardUuid: string, private toZoneIndex: number) {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    if (!game) return false;

    const player = game.getCurrentPlayer();
    const cardToPlay = player.hand.find(
      (c: CardInstance) => c.uuid === this.cardUuid
    );
    const targetSlotIsEmpty = player.signiZone[this.toZoneIndex] === null;

    return !!cardToPlay && targetSlotIsEmpty;
  }

  public execute(get: GameStoreGet): void {
    // Không cần Set nữa
    if (!this.canExecute(get)) return;

    const game = get().game!; // Chúng ta biết chắc là game tồn tại
    const player = game.getCurrentPlayer();

    // Gọi phương thức từ model
    const cardToPlay = player.placeSigniFromHand(
      this.cardUuid,
      this.toZoneIndex
    );

    if (!cardToPlay) {
      console.error("Failed to place signi", this.cardUuid, this.toZoneIndex);
      return;
    }

    // 2. Log và phát sự kiện
    get().addLog(
      `Đặt SIGNI: ${cardToPlay.name} vào vị trí ${this.toZoneIndex + 1}.`,
      "action"
    );
    eventService.dispatch(GameEvent.CARD_PLAYED, {
      cardId: cardToPlay.id,
      player: "player1",
    });

    // 3. Báo cho Zustand cập nhật UI
    useGameStore.getState().updateGame(game);
  }
}
