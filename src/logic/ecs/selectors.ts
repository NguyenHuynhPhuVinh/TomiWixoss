// src/logic/ecs/selectors.ts
import useGameStore from "@/store/gameStore";
import { CardInfoComponent, ZoneComponent } from "./components/card.components";

/**
 * Lấy ra các lựa chọn Grow hợp lệ cho một LRIG cụ thể trên sân.
 * @param zoneIndex Vị trí của LRIG trên sân (0, 1, hoặc 2).
 * @returns Mảng các Entity ID của các lá bài có thể Grow.
 */
export function getValidGrowOptions(zoneIndex: number): number[] {
  const { world, phase } = useGameStore.getState();
  if (!world) return [];

  const currentLrigEntity = world.query([ZoneComponent]).find((e) => {
    const zone = world.getComponent(e, ZoneComponent)!;
    return zone.zone === "lrigZone" && zone.index === zoneIndex;
  });

  if (!currentLrigEntity) return [];
  const currentLrigInfo = world.getComponent(
    currentLrigEntity,
    CardInfoComponent
  )!;

  const lrigDeckEntities = world
    .query([ZoneComponent])
    .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "lrigDeck");

  return lrigDeckEntities.filter((entity) => {
    const cardInfo = world.getComponent(entity, CardInfoComponent)!;

    // === LOGIC KIỂM TRA MỚI ===
    const isCenterGrow = zoneIndex === 1;

    if (isCenterGrow) {
      // Center LRIG chỉ có thể grow trong Grow Phase
      if (phase !== "grow") return false;
    } else {
      // Assist LRIG phải kiểm tra timing trên lá bài
      const enterAbility = cardInfo.data.abilities?.find(
        (a) => a.type === "Enter"
      );
      const allowedTimings = enterAbility?.timing;

      // Nếu không có timing được định nghĩa, hoặc phase hiện tại không nằm trong timing cho phép -> không hợp lệ
      if (!allowedTimings || !allowedTimings.includes(phase as any)) {
        return false;
      }
    }
    // ==========================

    // Kiểm tra level và lrigType như cũ
    return (
      cardInfo.data.level === (currentLrigInfo.data.level ?? -1) + 1 &&
      cardInfo.data.lrigType === currentLrigInfo.data.lrigType
    );
  });
}
