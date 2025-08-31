// src/logic/ecs/systems/draw.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  GlobalStateComponent,
  EffectStackComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { produce } from "immer"; // <-- IMPORT IMMER
import { v4 as uuidv4 } from "uuid";

export class DrawSystem implements System {
  private eventBus!: SystemDependencies["eventBus"];

  // Nhận dependency
  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;
  }

  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    if (!globalState) return;

    // Guard Clause: Chỉ chạy trong Draw Phase và khi chưa có hành động
    if (globalState.phase !== "draw" || globalState.actionTakenInPhase) {
      return;
    }

    console.log("--- Running DrawSystem ---");

    // 1. Xác định số lá bài cần rút
    const amountToDraw = globalState.turn === 1 ? 1 : 2;

    // THAY VÌ TỰ RÚT BÀI
    // Nó sẽ đẩy một hiệu ứng vào stack
    const effectStack = world.getComponent(
      GLOBAL_ENTITY,
      EffectStackComponent
    )!;
    effectStack.stack.push({
      id: uuidv4(),
      sourceEntity: GLOBAL_ENTITY,
      type: "DRAW_CARD",
      payload: { amount: amountToDraw, player: "player1" },
    });

    globalState.actionTakenInPhase = true;
  }
}
