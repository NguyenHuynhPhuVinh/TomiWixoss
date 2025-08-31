// src/logic/ecs/effects/drawCard.effect.ts
import { IEffectResolver } from "../effects.types";
import { World } from "../world";
import { GLOBAL_ENTITY } from "../game.factory";
import {
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GameEvent } from "../../core/events.types";
import eventBus from "../../core/event.bus";

export class DrawCardEffect implements IEffectResolver {
  public resolve(
    world: World,
    payload: { amount: number; player: string }
  ): void {
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;

    // 1. Truy vấn tất cả các lá bài trong Main Deck
    const mainDeckEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "mainDeck");

    if (mainDeckEntities.length === 0) {
      sideEffects.queue.push({
        type: "LOG",
        message: "Deck đã hết bài!",
        logType: "system",
      });
      return;
    }

    // 2. Sắp xếp deck theo index để lấy lá trên cùng
    mainDeckEntities.sort((a, b) => {
      const indexA = world.getComponent(a, ZoneComponent)!.index;
      const indexB = world.getComponent(b, ZoneComponent)!.index;
      return indexB - indexA; // Sắp xếp giảm dần, lá bài index cao nhất (trên cùng) sẽ ở đầu
    });

    // 3. Lấy ra các lá bài cần rút
    const cardsToDraw = mainDeckEntities.slice(0, payload.amount);

    // 4. Thay đổi Component của các lá bài đã rút
    for (const entity of cardsToDraw) {
      const zone = world.getComponent(entity, ZoneComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;

      zone.zone = "hand"; // Chuyển sang tay
      status.isFaceUp = true; // Lật ngửa

      // Reset index vì trong tay không cần thứ tự
      zone.index = 0;
    }

    // 5. Cập nhật lại index cho các lá còn lại trong deck
    const remainingDeck = mainDeckEntities.slice(payload.amount);
    remainingDeck.forEach((entity, i) => {
      const zone = world.getComponent(entity, ZoneComponent)!;
      zone.index = remainingDeck.length - 1 - i;
    });

    sideEffects.queue.push({
      type: "LOG",
      message: `Rút ${cardsToDraw.length} lá bài.`,
      logType: "action",
    });

    // Dispatch event so other systems (scripting, audio, UI) can react
    eventBus.dispatch(GameEvent.CARD_DRAWN, {
      drawnEntities: cardsToDraw,
      player: payload.player,
    });
  }
}
