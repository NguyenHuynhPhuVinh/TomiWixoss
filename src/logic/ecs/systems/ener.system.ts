// src/logic/ecs/systems/ener.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  CardInfoComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
// import useGameStore from "@/store/gameStore";
// import eventBus, { GameEvent } from "@/logic/core/event.bus"; // <-- XÓA, sẽ nhận qua dependency
import { GameEvent } from "@/logic/core/events.types";

export class EnerSystem implements System {
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

    if (!globalState || !actionRequest || !actionRequest.request) return;

    // Chỉ xử lý các yêu cầu liên quan đến Ener
    if (actionRequest.request.type !== "CHARGE_ENER") return;

    // Guard Clause: Chỉ chạy trong Ener Phase và khi chưa có hành động
    if (globalState.phase !== "ener" || globalState.actionTakenInPhase) {
      return;
    }

    console.log("--- Running EnerSystem ---", actionRequest.request.payload);
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;
    const { source, entityId } = actionRequest.request.payload;

    const zone = world.getComponent(entityId, ZoneComponent);
    const status = world.getComponent(entityId, StatusComponent);

    if (!zone || !status) {
      console.error(`Entity ${entityId} is not a valid card to charge ener.`);
      return;
    }

    // Lấy thông tin lá bài để log
    const cardInfo = world.getComponent(entityId, CardInfoComponent)!;

    // Thay đổi Component của lá bài được nạp
    zone.zone = "enerZone";
    status.isFaceUp = true;

    // Đánh dấu đã thực hiện hành động
    globalState.actionTakenInPhase = true;
    sideEffects.queue.push({
      type: "LOG",
      message: `Nạp Ener từ ${source}: ${cardInfo.data.name}.`,
      logType: "action",
    });

    // PHÁT SỰ KIỆN
    this.eventBus.dispatch(GameEvent.CARD_CHARGED, {
      entityId,
      source,
      cardId: cardInfo.data.id,
    });
  }
}
