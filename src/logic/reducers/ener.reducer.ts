// src/logic/reducers/ener.reducer.ts
import { World } from "../ecs/world";
import { Reducer } from "../core/reducer.types";
import { Entity } from "../ecs/ecs.types";
import {
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  CardInfoComponent,
  SideEffectComponent,
} from "../ecs/components/card.components";
import { GLOBAL_ENTITY } from "../ecs/game.factory";

export const chargeEnerReducer: Reducer<{
  type: "CHARGE_ENER";
  payload: { source: "hand" | "signi"; entityId: Entity };
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;

  // Guard Clause: Chỉ chạy trong Ener Phase và khi chưa có hành động
  if (globalState?.phase !== "ener" || globalState.actionTakenInPhase) {
    return;
  }

  const { source, entityId } = payload;

  const zone = draftWorld.getComponent(entityId, ZoneComponent);
  const status = draftWorld.getComponent(entityId, StatusComponent);

  if (!zone || !status) {
    console.error(`Entity ${entityId} is not a valid card to charge ener.`);
    return;
  }

  // Lấy thông tin lá bài để log
  const cardInfo = draftWorld.getComponent(entityId, CardInfoComponent)!;

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
};
