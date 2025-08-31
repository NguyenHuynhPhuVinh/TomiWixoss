// src/logic/ecs/systems/ener.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  CardInfoComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import useGameStore from "@/store/gameStore";

export class EnerSystem implements System {
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
      actionRequest.request = null; // Xóa yêu cầu không hợp lệ
      return;
    }

    console.log("--- Running EnerSystem ---", actionRequest.request.payload);
    const { addLog } = useGameStore.getState();
    const { source, entityId } = actionRequest.request.payload;

    const zone = world.getComponent(entityId, ZoneComponent);
    const status = world.getComponent(entityId, StatusComponent);

    if (!zone || !status) {
      console.error(`Entity ${entityId} is not a valid card to charge ener.`);
      actionRequest.request = null;
      return;
    }

    // Lấy thông tin lá bài để log
    const cardInfo = world.getComponent(entityId, CardInfoComponent)!;

    // Thay đổi Component của lá bài được nạp
    zone.zone = "enerZone";
    status.isFaceUp = true;

    // Đánh dấu đã thực hiện hành động
    globalState.actionTakenInPhase = true;
    addLog(`Nạp Ener từ ${source}: ${cardInfo.data.name}.`, "action");

    // Dọn dẹp yêu cầu sau khi đã xử lý xong
    actionRequest.request = null;
  }
}
