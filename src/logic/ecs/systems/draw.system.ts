// src/logic/ecs/systems/draw.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { GameEvent } from "@/logic/core/events.types";
import { produce } from "immer"; // <-- IMPORT IMMER

export class DrawSystem implements System {
  private eventBus!: SystemDependencies["eventBus"];

  // Nhận dependency
  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;
  }

  public update(world: World): World {
    return produce(world, (draftWorld) => {
      const globalState = draftWorld.getComponent(
        GLOBAL_ENTITY,
        GlobalStateComponent
      );
      if (!globalState) return;

      // Guard Clause: Chỉ chạy trong Draw Phase và khi chưa có hành động
      if (globalState.phase !== "draw" || globalState.actionTakenInPhase) {
        return;
      }

      console.log("--- Running DrawSystem ---");
      const sideEffects = draftWorld.getComponent(
        GLOBAL_ENTITY,
        SideEffectComponent
      )!;

      // 1. Xác định số lá bài cần rút
      const amountToDraw = globalState.turn === 1 ? 1 : 2;

      // 2. Truy vấn tất cả các lá bài trong Main Deck
      const mainDeckEntities = draftWorld
        .query([ZoneComponent])
        .filter(
          (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "mainDeck"
        );

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
        const indexA = draftWorld.getComponent(a, ZoneComponent)!.index;
        const indexB = draftWorld.getComponent(b, ZoneComponent)!.index;
        return indexB - indexA; // Sắp xếp giảm dần, lá bài index cao nhất (trên cùng) sẽ ở đầu
      });

      // 4. Lấy ra các lá bài cần rút
      const cardsToDraw = mainDeckEntities.slice(0, amountToDraw);

      // 5. Thay đổi Component của các lá bài đã rút
      for (const entity of cardsToDraw) {
        const zone = draftWorld.getComponent(entity, ZoneComponent)!;
        const status = draftWorld.getComponent(entity, StatusComponent)!;

        zone.zone = "hand"; // Chuyển sang tay
        status.isFaceUp = true; // Lật ngửa

        // Reset index vì trong tay không cần thứ tự
        zone.index = 0;
      }

      // 6. Cập nhật lại index cho các lá còn lại trong deck
      const remainingDeck = mainDeckEntities.slice(amountToDraw);
      remainingDeck.forEach((entity, i) => {
        const zone = draftWorld.getComponent(entity, ZoneComponent)!;
        zone.index = remainingDeck.length - 1 - i;
      });

      sideEffects.queue.push({
        type: "LOG",
        message: `Rút ${cardsToDraw.length} lá bài.`,
        logType: "action",
      });
      globalState.actionTakenInPhase = true; // Đánh dấu đã thực hiện

      // Dispatch event so other systems (scripting, audio, UI) can react
      this.eventBus.dispatch(GameEvent.CARD_DRAWN, {
        drawnEntities: cardsToDraw,
        player: globalState.turn === 1 ? "player1" : "player2",
      });
    });
  }
}
