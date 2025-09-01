// src/logic/ecs/systems/draw.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  GlobalStateComponent,
  EffectStackComponent, // <-- Import EffectStackComponent
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";

export class DrawSystem implements System {
  // Không cần eventBus nữa vì nó không phát sự kiện trực tiếp
  public setup(): void {}

  public update(world: World): void {
    const globalState = world.getComponent<GlobalStateComponent>(
      GLOBAL_ENTITY,
      "GlobalState"
    );

    if (
      !globalState ||
      globalState.phase !== "draw" ||
      globalState.actionTakenInPhase
    ) {
      return;
    }

    console.log(
      "--- Running DrawSystem: Pushing DRAW_CARD effect to stack ---"
    );

    // Lấy EffectStackComponent
    const effectStack = world.getComponent<EffectStackComponent>(
      GLOBAL_ENTITY,
      "EffectStack"
    )!;

    // Xác định số lá bài cần rút
    const amountToDraw = globalState.turn === 1 ? 1 : 2;

    // ĐƯA HIỆU ỨNG VÀO STACK
    effectStack.stack.push({
      id: `draw-${Date.now()}`,
      sourceEntity: GLOBAL_ENTITY, // Hiệu ứng từ hệ thống game
      type: "DRAW_CARD",
      payload: {
        amount: amountToDraw,
        player: "player", // Tạm thời hard-code
      },
    });

    // QUAN TRỌNG: Đặt cờ để báo hiệu phase đã hoàn thành
    globalState.actionTakenInPhase = true;
  }
}
