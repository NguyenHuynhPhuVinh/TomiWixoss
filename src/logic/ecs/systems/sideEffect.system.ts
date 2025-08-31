// src/logic/ecs/systems/sideEffect.system.ts
import { produce } from "immer";
import { System } from "../ecs.types";
import { World } from "../world";
import { GLOBAL_ENTITY } from "../game.factory";
import { SideEffectComponent } from "../components/card.components";
import useGameStore from "@/store/gameStore";

export class SideEffectSystem implements System {
  // System này không cần dependency vì nó gọi trực tiếp ra ngoài

  public update(world: World): void {
    // System này không nên chạy nếu không có gì để xử lý
    const sideEffectComponent = world.getComponent(
      GLOBAL_ENTITY,
      SideEffectComponent
    );
    if (!sideEffectComponent || sideEffectComponent.queue.length === 0) {
      return;
    }

    console.log(
      `%c--- Running SideEffectSystem: Processing ${sideEffectComponent.queue.length} effects ---`,
      "color: #16A085"
    );

    // 1. Lấy ra các action của store MỘT LẦN
    const { addLog, setMustDiscard, openZoneViewer, closeZoneViewer } =
      useGameStore.getState();

    // 2. Xử lý các hiệu ứng từ queue (đây là ĐỌC từ state cũ)
    for (const effect of sideEffectComponent.queue) {
      switch (effect.type) {
        case "LOG":
          addLog(effect.message, effect.logType);
          break;
        case "UPDATE_UI_FLAG":
          if (effect.flag === "mustDiscard") {
            setMustDiscard(effect.value);
          }
          if (effect.flag === "isZoneViewerOpen") {
            if (effect.value) openZoneViewer();
            else closeZoneViewer();
          }
          break;
      }
    }

    // 3. Dọn dẹp queue
    sideEffectComponent.queue = [];
  }
}
