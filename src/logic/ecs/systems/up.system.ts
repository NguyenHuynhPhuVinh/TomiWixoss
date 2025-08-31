// src/logic/ecs/systems/up.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import { StatusComponent, ZoneComponent } from "../components/card.components";
import useGameStore from "@/store/gameStore"; // Chúng ta vẫn cần store để biết khi nào cần chạy

export class UpSystem implements System {
  private hasRunThisPhase = false;

  public update(world: World): void {
    // Lấy phase từ một component toàn cục trong world (cách làm đúng chuẩn ECS)
    // Tạm thời, chúng ta sẽ giả định có một GlobalStateComponent
    // const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    // if (globalState.phase !== 'up' || this.hasRunThisPhase) return;

    // Cách đơn giản hơn cho bây giờ:
    const phase = useGameStore.getState().phase;
    if (phase !== "up" || this.hasRunThisPhase) {
      if (phase !== "up") this.hasRunThisPhase = false; // Reset khi qua phase mới
      return;
    }

    console.log("--- Running UpSystem ---");
    // ... logic truy vấn và thay đổi StatusComponent như cũ ...

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

    this.hasRunThisPhase = true; // System tự quản lý trạng thái của nó
    console.log("UpSystem has finished for this phase.");
  }
}
