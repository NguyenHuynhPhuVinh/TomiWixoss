// src/logic/ecs/systems/up.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  StatusComponent,
  ZoneComponent,
  GlobalStateComponent,
  SideEffectComponent,
  CardInfoComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { GameEvent } from "@/logic/core/events.types";
import { produce } from "immer"; // <-- IMPORT IMMER

export class UpSystem implements System {
  private eventBus!: SystemDependencies["eventBus"];

  // Nhận dependency
  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;
  }

  // Bỏ `hasRunThisPhase` vì chúng ta sẽ dùng cờ toàn cục
  // private hasRunThisPhase = false;

  public update(world: World): World {
    return produce(world, (draftWorld) => {
      const globalState = draftWorld.getComponent(
        GLOBAL_ENTITY,
        GlobalStateComponent
      );
      if (
        !globalState ||
        globalState.phase !== "up" ||
        globalState.actionTakenInPhase
      ) {
        return; // Immer sẽ tự động trả về world gốc nếu không có thay đổi
      }

      console.log("--- Running UpSystem ---");
      const sideEffects = draftWorld.getComponent(
        GLOBAL_ENTITY,
        SideEffectComponent
      )!;

      let uppedCardCount = 0;
      const uppedEntities: number[] = [];
      const entitiesToUp = draftWorld.query([StatusComponent, ZoneComponent]);

      for (const entity of entitiesToUp) {
        const zone = draftWorld.getComponent(entity, ZoneComponent)!;

        if (zone.zone === "signiZone" || zone.zone === "lrigZone") {
          const status = draftWorld.getComponent(entity, StatusComponent)!;

          // TODO: Thêm logic kiểm tra "Frozen" ở đây
          // if (status.isFrozen) continue;

          if (status.isDowned) {
            status.isDowned = false;
            uppedCardCount++;
            uppedEntities.push(entity);
          }
        }
      }

      if (uppedCardCount > 0) {
        sideEffects.queue.push({
          type: "LOG",
          message: `Up ${uppedCardCount} lá bài trên sân.`,
          logType: "action",
        });
        this.eventBus.dispatch(GameEvent.CARDS_UPPED, {
          uppedEntities: uppedEntities,
          cardIds: uppedEntities.map(
            (e) => draftWorld.getComponent(e, CardInfoComponent)!.data.id
          ),
        });
      } else {
        sideEffects.queue.push({
          type: "LOG",
          message: "Không có lá bài nào cần Up.",
          logType: "info",
        });
      }

      // Quan trọng: Báo cho toàn bộ game biết hành động của phase này đã hoàn thành
      globalState.actionTakenInPhase = true;
    });
  }
}
