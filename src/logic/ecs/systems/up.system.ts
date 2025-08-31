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

  public update(world: World): void {
    const globalState = world.getComponent<GlobalStateComponent>(
      GLOBAL_ENTITY,
      "GlobalState"
    );
    if (
      !globalState ||
      globalState.phase !== "up" ||
      globalState.actionTakenInPhase
    ) {
      return;
    }

    console.log("--- Running UpSystem ---");
    const sideEffects = world.getComponent<SideEffectComponent>(
      GLOBAL_ENTITY,
      "SideEffect"
    )!;

    let uppedCardCount = 0;
    const uppedEntities: number[] = [];
    const entitiesToUp = world.query(["Status", "Zone"]);

    for (const entity of entitiesToUp) {
      const zone = world.getComponent<ZoneComponent>(entity, "Zone")!;

      if (zone.zone === "signiZone" || zone.zone === "lrigZone") {
        const status = world.getComponent<StatusComponent>(entity, "Status")!;

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
          (e) => world.getComponent<CardInfoComponent>(e, "CardInfo")!.data.id
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
  }
}
