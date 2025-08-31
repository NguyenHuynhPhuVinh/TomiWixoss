// src/logic/ecs/systems/up.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  StatusComponent,
  ZoneComponent,
  GlobalStateComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import useGameStore from "@/store/gameStore";
import eventBus, { GameEvent } from "@/logic/core/event.bus";

export class UpSystem implements System {
  // Bỏ `hasRunThisPhase` vì chúng ta sẽ dùng cờ toàn cục
  // private hasRunThisPhase = false;

  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    if (!globalState) return;

    // Guard Clause: Chỉ chạy trong Up Phase và khi chưa có hành động
    if (globalState.phase !== "up" || globalState.actionTakenInPhase) {
      return;
    }

    console.log("--- Running UpSystem ---");
    const { addLog } = useGameStore.getState();

    let uppedCardCount = 0;
    const entitiesToUp = world.query([StatusComponent, ZoneComponent]);

    for (const entity of entitiesToUp) {
      const zone = world.getComponent(entity, ZoneComponent)!;

      if (zone.zone === "signiZone" || zone.zone === "lrigZone") {
        const status = world.getComponent(entity, StatusComponent)!;

        // TODO: Thêm logic kiểm tra "Frozen" ở đây
        // if (status.isFrozen) continue;

        if (status.isDowned) {
          status.isDowned = false;
          uppedCardCount++;
        }
      }
    }

    if (uppedCardCount > 0) {
      addLog(`Up ${uppedCardCount} lá bài trên sân.`, "action");
      eventBus.dispatch(GameEvent.CARDS_UPPED, {
        count: uppedCardCount,
      });
    } else {
      addLog("Không có lá bài nào cần Up.", "info");
    }

    // Quan trọng: Báo cho toàn bộ game biết hành động của phase này đã hoàn thành
    globalState.actionTakenInPhase = true;
  }
}
