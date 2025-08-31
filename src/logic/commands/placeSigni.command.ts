// src/logic/commands/placeSigni.command.ts
import { ICommand, GameStoreGet, GameStoreSet } from "./command.interface";
import eventService, { GameEvent } from "../core/event.service";

export class PlaceSigniCommand implements ICommand {
  // Command sẽ nhận các tham số cần thiết khi được tạo
  constructor(private cardUuid: string, private toZoneIndex: number) {}

  public canExecute(get: GameStoreGet): boolean {
    const state = get();
    const cardToPlay = state.player.hand.find((c) => c.uuid === this.cardUuid);
    const targetSlotIsEmpty = state.player.signiZone[this.toZoneIndex] === null;

    if (!cardToPlay || !targetSlotIsEmpty) {
      return false;
    }

    // TODO: Thêm lại logic kiểm tra Level và Limit ở đây
    // const lrig = state.player.lrigZone[1];
    // ...

    return true;
  }

  public execute(get: GameStoreGet, set: GameStoreSet): void {
    if (!this.canExecute(get)) {
      console.warn("Cannot execute PlaceSigniCommand.");
      return;
    }

    const cardToPlay = get().player.hand.find((c) => c.uuid === this.cardUuid)!;

    get().addLog(
      `Đặt SIGNI: ${cardToPlay.name} vào vị trí ${this.toZoneIndex + 1}.`,
      "action"
    );

    set((state) => {
      const newHand = state.player.hand.filter((c) => c.uuid !== this.cardUuid);
      const newSigniZone = [...state.player.signiZone];

      cardToPlay.isFaceUp = true;
      newSigniZone[this.toZoneIndex] = cardToPlay;

      return {
        player: {
          ...state.player,
          hand: newHand,
          signiZone: newSigniZone,
        },
        playerAction: null, // Hoàn thành và thoát chế độ hành động
      };
    });

    // Phát sự kiện sau khi state đã được cập nhật
    eventService.dispatch(GameEvent.CARD_PLAYED, {
      cardId: cardToPlay.id,
      player: "player1",
    });
  }
}
