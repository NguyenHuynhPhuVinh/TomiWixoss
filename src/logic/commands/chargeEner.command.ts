// src/logic/commands/chargeEner.command.ts
import { ICommand, GameStoreGet, GameStoreSet } from "./command.interface";

type EnerSource =
  | { from: "hand"; cardUuid: string }
  | { from: "signi"; zoneIndex: number };

export class ChargeEnerCommand implements ICommand {
  constructor(private source: EnerSource) {}

  public canExecute(get: GameStoreGet): boolean {
    const state = get();
    return state.phase === "ener" && !state.actionTakenInPhase;
  }

  public execute(get: GameStoreGet, set: GameStoreSet): void {
    if (!this.canExecute(get)) return;

    let cardToCharge: any = null; // Tạm dùng any để linh hoạt

    if (this.source.from === "hand") {
      cardToCharge = get().player.hand.find(
        (c) =>
          c.uuid ===
          (this.source as { from: "hand"; cardUuid: string }).cardUuid
      );
    } else {
      cardToCharge =
        get().player.signiZone[
          (this.source as { from: "signi"; zoneIndex: number }).zoneIndex
        ];
    }

    if (!cardToCharge) {
      console.error("Card not found for ChargeEnerCommand", this.source);
      return;
    }

    get().addLog(
      `Nạp Ener từ ${this.source.from === "hand" ? "tay" : "sân"}: ${
        cardToCharge.name
      }.`,
      "action"
    );

    set((state) => {
      let newHand = [...state.player.hand];
      let newSigniZone = [...state.player.signiZone];

      if (this.source.from === "hand") {
        newHand = state.player.hand.filter(
          (c) =>
            c.uuid !==
            (this.source as { from: "hand"; cardUuid: string }).cardUuid
        );
      } else {
        newSigniZone[
          (this.source as { from: "signi"; zoneIndex: number }).zoneIndex
        ] = null;
      }

      cardToCharge.isFaceUp = true;
      const newEnerZone = [...state.player.enerZone, cardToCharge];

      return {
        player: {
          ...state.player,
          hand: newHand,
          signiZone: newSigniZone,
          enerZone: newEnerZone,
        },
        actionTakenInPhase: true,
      };
    });
  }
}
