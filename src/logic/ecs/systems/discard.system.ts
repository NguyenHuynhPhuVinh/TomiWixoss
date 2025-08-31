// src/logic/ecs/systems/discard.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
// import useGameStore from "@/store/gameStore";
// import eventBus, { GameEvent } from "@/logic/core/event.bus"; // <-- XÓA, sẽ nhận qua dependency
import { GameEvent } from "@/logic/core/events.types";

export class DiscardSystem implements System {
  private eventBus!: SystemDependencies["eventBus"];

  // Nhận dependency
  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;
  }

  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );

    if (
      !globalState ||
      !actionRequest ||
      actionRequest.request?.type !== "DISCARD_CARD"
    ) {
      return;
    }

    console.log("--- Running DiscardSystem ---");
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;
    const { entityId } = actionRequest.request.payload;

    // Di chuyển lá bài vào mộ
    const zone = world.getComponent(entityId, ZoneComponent)!;
    zone.zone = "trash";

    const cardInfo = world.getComponent(entityId, CardInfoComponent)!;
    sideEffects.queue.push({
      type: "LOG",
      message: `Bỏ bài: ${cardInfo.data.name}.`,
      logType: "action",
    });

    // Kiểm tra lại sau khi bỏ
    const handSize = world
      .query([ZoneComponent])
      .filter(
        (e) => world.getComponent(e, ZoneComponent)!.zone === "hand"
      ).length;
    if (handSize <= 6) {
      sideEffects.queue.push({
        type: "UPDATE_UI_FLAG",
        flag: "mustDiscard",
        value: false,
      });
    }

    // PHÁT SỰ KIỆN BỎ BÀI
    this.eventBus.dispatch(GameEvent.CARD_DISCARDED, {
      entityId,
      cardId: cardInfo.data.id,
    });
  }
}
