// src/logic/ecs/systems/draw.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
// import useGameStore from "@/store/gameStore";
import eventBus, { GameEvent } from "@/logic/core/event.bus";

export class DrawSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    if (!globalState) return;

    // Guard Clause: Chỉ chạy trong Draw Phase và khi chưa có hành động
    if (globalState.phase !== "draw" || globalState.actionTakenInPhase) {
      return;
    }

    console.log("--- Running DrawSystem ---");
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;

    // 1. Xác định số lá bài cần rút
    const amountToDraw = globalState.turn === 1 ? 1 : 2;

    // 2. Truy vấn tất cả các lá bài trong Main Deck
    const mainDeckEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "mainDeck");

    if (mainDeckEntities.length === 0) {
      sideEffects.queue.push({
        type: "LOG",
        message: "Deck đã hết bài!",
        logType: "system",
      });
      globalState.actionTakenInPhase = true; // Đánh dấu đã xong để không chạy lại
      return;
    }

    // 3. Sắp xếp deck theo index để lấy lá trên cùng
    mainDeckEntities.sort((a, b) => {
      const indexA = world.getComponent(a, ZoneComponent)!.index;
      const indexB = world.getComponent(b, ZoneComponent)!.index;
      return indexB - indexA; // Sắp xếp giảm dần, lá bài index cao nhất (trên cùng) sẽ ở đầu
    });

    // 4. Lấy ra các lá bài cần rút
    const cardsToDraw = mainDeckEntities.slice(0, amountToDraw);

    // 5. Thay đổi Component của các lá bài đã rút
    for (const entity of cardsToDraw) {
      const zone = world.getComponent(entity, ZoneComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;

      zone.zone = "hand"; // Chuyển sang tay
      status.isFaceUp = true; // Lật ngửa

      // Reset index vì trong tay không cần thứ tự
      zone.index = 0;
    }

    // 6. Cập nhật lại index cho các lá còn lại trong deck
    const remainingDeck = mainDeckEntities.slice(amountToDraw);
    remainingDeck.forEach((entity, i) => {
      const zone = world.getComponent(entity, ZoneComponent)!;
      zone.index = remainingDeck.length - 1 - i;
    });

    sideEffects.queue.push({
      type: "LOG",
      message: `Rút ${cardsToDraw.length} lá bài.`,
      logType: "action",
    });
    globalState.actionTakenInPhase = true; // Đánh dấu đã thực hiện

    // Dispatch event so other systems (scripting, audio, UI) can react
    eventBus.dispatch(GameEvent.CARD_DRAWN, {
      drawnEntities: cardsToDraw,
      player: globalState.turn === 1 ? "player1" : "player2",
    });
  }
}
