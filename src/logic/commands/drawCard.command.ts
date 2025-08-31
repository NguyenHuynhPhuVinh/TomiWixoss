// src/logic/commands/drawCard.command.ts
import { ICommand, GameStoreGet, GameStoreSet } from "./command.interface";
import { CardInstance } from "@/types/game";
import eventService, { GameEvent } from "../core/event.service";

export class DrawCardCommand implements ICommand {
  constructor() {} // Command này không cần tham số

  public canExecute(get: GameStoreGet): boolean {
    const state = get();
    // Điều kiện: đúng phase, chưa hành động, và deck còn bài
    return (
      state.phase === "draw" &&
      !state.actionTakenInPhase &&
      state.player.mainDeck.length > 0
    );
  }

  public execute(get: GameStoreGet, set: GameStoreSet): void {
    if (!this.canExecute(get)) return;

    const amountToDraw = get().turn === 1 ? 1 : 2;
    get().addLog(`Rút ${amountToDraw} lá bài.`, "action");

    set((state) => {
      const playerMainDeck = [...state.player.mainDeck];
      const drawnCards: CardInstance[] = [];
      for (let i = 0; i < amountToDraw && playerMainDeck.length > 0; i++) {
        const drawnCard = playerMainDeck.pop()!;
        drawnCard.isFaceUp = true;
        drawnCards.push(drawnCard);
      }

      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck,
          hand: [...state.player.hand, ...drawnCards],
        },
        actionTakenInPhase: true, // Đánh dấu đã rút bài
      };
    });

    eventService.dispatch(GameEvent.CARD_DRAWN, {
      count: amountToDraw,
      player: "player1",
    });
  }
}
