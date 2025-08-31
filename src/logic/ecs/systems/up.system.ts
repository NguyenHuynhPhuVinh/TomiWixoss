// src/logic/ecs/systems/up.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import { StatusComponent, ZoneComponent } from "../components/card.components";
import useGameStore from "@/store/gameStore"; // Chúng ta vẫn cần store để biết khi nào cần chạy

export class UpSystem implements System {
  public update(world: World): void {
    // System này chỉ nên chạy trong Up Phase
    const phase = useGameStore.getState().phase;
    if (phase !== "up") {
      return;
    }

    // Lấy ra action `hasUpPhaseActionBeenTaken` để tránh chạy nhiều lần
    // (Đây là một cách để kết nối System với State tổng)
    const actionTaken = useGameStore.getState().actionTakenInPhase;
    if (actionTaken) {
      return;
    }

    console.log("--- Running UpSystem ---");

    // 1. Truy vấn: Tìm tất cả các Entity có cả StatusComponent và ZoneComponent
    const entitiesToUp = world.query([StatusComponent, ZoneComponent]);

    for (const entity of entitiesToUp) {
      const zone = world.getComponent(entity, ZoneComponent)!;

      // 2. Lọc: Chỉ "up" các lá bài trên sân
      if (zone.zone === "signiZone" || zone.zone === "lrigZone") {
        const status = world.getComponent(entity, StatusComponent)!;

        // 3. Hành động: Thay đổi dữ liệu trong Component
        if (status.isDowned) {
          status.isDowned = false;
          console.log(`Entity ${entity} has been upped.`);
        }
      }
    }

    // Báo cho store biết là hành động của phase này đã xong
    useGameStore.getState().setActionTakenInPhase(true);
  }
}
