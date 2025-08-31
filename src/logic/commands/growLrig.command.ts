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
    if (!game) return false;

    // === SỬA LỖI LOGIC Ở ĐÂY ===
    // 1. Kiểm tra xem có đang ở phase cho phép Grow không
    const isAllowedPhase =
      game.phase === "grow" || game.phase === "main" || game.phase === "attack";
    if (!isAllowedPhase) return false;

    // 2. Nếu đang ở Grow Phase, phải kiểm tra actionTakenInPhase
    if (game.phase === "grow" && game.actionTakenInPhase) {
      console.warn("Grow action has already been taken in Grow Phase.");
      return false;
    }
    // (Đối với Main/Attack phase, luật cho phép Grow Assist LRIG nhiều lần, nên chúng ta không kiểm tra cờ này)

    // TODO: Thêm các logic kiểm tra điều kiện Grow chi tiết hơn (level, type, timing, cost)
    // ...

    return true;
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

    // === CẬP NHẬT CỜ `actionTakenInPhase` ===
    // Chỉ set cờ này thành true nếu đang ở trong Grow Phase
    if (game.phase === "grow") {
      game.actionTakenInPhase = true;
    }
    // =====================================

    // Log và cập nhật UI
    get().addLog(`Trả ${paymentResult.paidEner.length} Ener.`, "cost");
    get().addLog(`Grow LRIG thành ${targetLrigData.name}!`, "action");
    useGameStore.getState().closeLrigDeckViewer();
    useGameStore.getState().updateGame(game);
  }
}
