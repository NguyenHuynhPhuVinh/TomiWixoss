// src/logic/commands/chargeEner.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";
import { CardInstance } from "@/types/game";

type EnerSource =
  | { from: "hand"; cardUuid: string }
  | { from: "signi"; zoneIndex: number };

export class ChargeEnerCommand implements ICommand {
  constructor(private source: EnerSource) {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    return !!game && game.phase === "ener" && !game.actionTakenInPhase;
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;

    const game = get().game!;
    const player = game.getCurrentPlayer();
    let chargedCard: CardInstance | null = null;

    // Gọi phương thức từ model
    if (this.source.from === "hand") {
      chargedCard = player.chargeEnerFromHand(this.source.cardUuid);
    } else {
      chargedCard = player.chargeEnerFromSigni(this.source.zoneIndex);
    }

    if (chargedCard) {
      game.actionTakenInPhase = true;
      get().addLog(
        `Nạp Ener từ ${this.source.from === "hand" ? "tay" : "sân"}: ${
          chargedCard.name
        }.`,
        "action"
      );
      useGameStore.getState().updateGame(game);
    } else {
      console.error("Failed to charge ener", this.source);
    }
  }
}
