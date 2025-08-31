// src/logic/commands/growLrig.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";
import { CardInstance } from "@/types/game";

export class GrowLrigCommand implements ICommand {
  constructor(
    private targetLrigUuid: string,
    private zoneIndex: number // 0, 1, or 2
  ) {}

  public canExecute(get: GameStoreGet): boolean {
    const game = get().game;
    const state = get();
    if (!game) return false;

    // TODO: Thêm logic kiểm tra điều kiện Grow (level, type, timing, cost)
    // Tạm thời luôn cho là true nếu ở đúng phase
    return (
      game.phase === "grow" || game.phase === "main" || game.phase === "attack"
    );
  }

  public execute(get: GameStoreGet): void {
    if (!this.canExecute(get)) return;

    const game = get().game!;
    const player = game.player;
    const targetLrigData = player.lrigDeck.find(
      (c: CardInstance) => c.uuid === this.targetLrigUuid
    );
    const currentLrig = player.lrigZone[this.zoneIndex];

    if (!targetLrigData || !currentLrig) return;

    // --- Logic kiểm tra và thanh toán cost ---
    const cost = targetLrigData.growCost;
    if (!cost || !this.checkCost(cost, player.enerZone).canPay) {
      get().addLog("Không thể Grow: Không đủ Ener.", "info");
      return;
    }
    const { remainingEner, paidEner } = this.checkCost(cost, player.enerZone);
    player.enerZone = remainingEner;
    player.trash.push(...paidEner);
    // ------------------------------------

    // --- Logic cập nhật Model ---
    const newLrig: CardInstance = {
      ...targetLrigData,
      isFaceUp: true,
      underneathCards: [currentLrig, ...(currentLrig.underneathCards || [])],
    };
    player.lrigZone[this.zoneIndex] = newLrig;
    player.lrigDeck = player.lrigDeck.filter(
      (c: CardInstance) => c.uuid !== this.targetLrigUuid
    );

    // Log và cập nhật UI
    get().addLog(`Trả ${paidEner.length} Ener.`, "cost");
    get().addLog(`Grow LRIG thành ${targetLrigData.name}!`, "action");
    useGameStore.getState().closeLrigDeckViewer();
    useGameStore.getState().updateGame(game);
  }

  private checkCost(
    cost: any,
    enerZone: CardInstance[]
  ): {
    canPay: boolean;
    remainingEner: CardInstance[];
    paidEner: CardInstance[];
  } {
    // Tạm thời implement đơn giản
    if (cost && cost.length > 0 && enerZone.length >= cost.length) {
      const paidEner = enerZone.slice(0, cost.length);
      const remainingEner = enerZone.slice(cost.length);
      return { canPay: true, remainingEner, paidEner };
    }
    return { canPay: false, remainingEner: enerZone, paidEner: [] };
  }
}
