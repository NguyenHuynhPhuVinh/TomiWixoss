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
import { GameEvent } from "@/logic/core/events.types";
import { produce } from "immer"; // <-- IMPORT IMMER

export class DiscardSystem implements System {
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
      const actionRequest = draftWorld.getComponent(
        GLOBAL_ENTITY,
        ActionRequestComponent
      );

      if (
        !globalState ||
        !actionRequest ||
        actionRequest.request?.type !== "DISCARD_CARD"
      ) {
        return; // Immer sẽ tự động trả về world gốc nếu không có thay đổi
      }

      console.log("--- Running DiscardSystem ---");
      const sideEffects = draftWorld.getComponent(
        GLOBAL_ENTITY,
        SideEffectComponent
      )!;
      const { entityId } = actionRequest.request.payload;

      // Di chuyển lá bài vào mộ
      const zone = draftWorld.getComponent(entityId, ZoneComponent)!;
      zone.zone = "trash";

      const cardInfo = draftWorld.getComponent(entityId, CardInfoComponent)!;
      sideEffects.queue.push({
        type: "LOG",
        message: `Bỏ bài: ${cardInfo.data.name}.`,
        logType: "action",
      });

      // Kiểm tra lại sau khi bỏ
      const handSize = draftWorld
        .query([ZoneComponent])
        .filter(
          (e) => draftWorld.getComponent(e, ZoneComponent)!.zone === "hand"
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
    });
  }
}
