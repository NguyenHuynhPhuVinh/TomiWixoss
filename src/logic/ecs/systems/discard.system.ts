// src/logic/ecs/systems/discard.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import useGameStore from "@/store/gameStore";
import eventBus, { GameEvent } from "@/logic/core/event.bus";

export class DiscardSystem implements System {
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
    const { addLog, setMustDiscard } = useGameStore.getState();
    const { entityId } = actionRequest.request.payload;

    // Di chuyển lá bài vào mộ
    const zone = world.getComponent(entityId, ZoneComponent)!;
    zone.zone = "trash";

    const cardInfo = world.getComponent(entityId, CardInfoComponent)!;
    addLog(`Bỏ bài: ${cardInfo.data.name}.`, "action");

    // Kiểm tra lại sau khi bỏ
    const handSize = world
      .query([ZoneComponent])
      .filter(
        (e) => world.getComponent(e, ZoneComponent)!.zone === "hand"
      ).length;
    if (handSize <= 6) {
      setMustDiscard(false); // Tắt chế độ bỏ bài
    }

    // PHÁT SỰ KIỆN BỎ BÀI
    eventBus.dispatch(GameEvent.CARD_DISCARDED, {
      entityId,
      cardId: cardInfo.data.id,
    });
  }
}
