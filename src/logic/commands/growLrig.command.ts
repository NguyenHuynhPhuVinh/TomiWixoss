// src/logic/commands/growLrig.command.ts
import { ICommand, GameStoreGet } from "./command.interface";
import useGameStore from "@/store/gameStore";
import { CardInstance } from "@/types/game";
import { checkCost } from "../payment";

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
    const paymentResult = checkCost(cost, player.enerZone);
    if (!paymentResult.canPay) {
      get().addLog("Không thể Grow: Không đủ Ener.", "info");
      return;
    }
    player.enerZone = paymentResult.remainingEner;
    player.trash.push(...paymentResult.paidEner);
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
    get().addLog(`Trả ${paymentResult.paidEner.length} Ener.`, "cost");
    get().addLog(`Grow LRIG thành ${targetLrigData.name}!`, "action");
    useGameStore.getState().closeLrigDeckViewer();
    useGameStore.getState().updateGame(game);
  }
}
