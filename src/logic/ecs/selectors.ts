// src/logic/ecs/selectors.ts
// import useGameStore from "@/store/gameStore";
import { World } from "./world";
import { GamePhase } from "@/types/game";
import { CardInfoComponent, ZoneComponent } from "./components/card.components";

/**
 * Lấy ra các lựa chọn Grow hợp lệ cho một LRIG cụ thể trên sân.
 * @param world Thế giới ECS
 * @param phase Phase hiện tại
 * @param zoneIndex Vị trí của LRIG trên sân (0, 1, hoặc 2).
 * @returns Mảng các Entity ID của các lá bài có thể Grow.
 */
export function getValidGrowOptions(
  world: World,
  phase: GamePhase,
  zoneIndex: number
): number[] {
  if (!world) return [];

  // === LẤY THÔNG TIN CENTER LRIG ĐỂ SO SÁNH ===
  const centerLrigEntity = world.query([ZoneComponent]).find((e: number) => {
    const zone = world.getComponent(e, ZoneComponent)!;
    return zone.zone === "lrigZone" && zone.index === 1;
  });
  // Nếu không có Center LRIG (trường hợp rất hiếm), không cho Grow gì cả
  if (!centerLrigEntity) return [];
  const centerLrigInfo = world.getComponent(
    centerLrigEntity,
    CardInfoComponent
  )!;
  const centerLrigLevel = centerLrigInfo.data.level ?? 0;
  // ============================================

  const currentLrigEntity = world.query([ZoneComponent]).find((e: number) => {
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
    .filter(
      (e: number) => world.getComponent(e, ZoneComponent)!.zone === "lrigDeck"
    );

  return lrigDeckEntities.filter((entity: number) => {
    const cardInfo = world.getComponent(entity, CardInfoComponent)!;

    // === LOGIC KIỂM TRA MỚI ===
    const isCenterGrow = zoneIndex === 1;

    if (isCenterGrow) {
      // Center LRIG chỉ có thể grow trong Grow Phase
      if (phase !== "grow") return false;
    } else {
      // Assist LRIG phải kiểm tra timing trên lá bài
      const enterAbility = cardInfo.data.abilities?.find(
        (a: any) => a.type === "Enter"
      );
      const allowedTimings = enterAbility?.timing;

      // Nếu không có timing được định nghĩa, hoặc phase hiện tại không nằm trong timing cho phép -> không hợp lệ
      if (!allowedTimings || !allowedTimings.includes(phase as any)) {
        return false;
      }
    }
    // ==========================

    // === THÊM ĐIỀU KIỆN KIỂM TRA MỚI CHO ASSIST LRIG ===
    if (zoneIndex !== 1) {
      // Nếu đang kiểm tra cho Assist LRIG
      const targetLevel = cardInfo.data.level ?? 0;
      if (targetLevel > centerLrigLevel) {
        return false; // Loại bỏ nếu level cao hơn Center
      }
    }
    // ===============================================

    // Kiểm tra level và lrigType như cũ
    return (
      cardInfo.data.level === (currentLrigInfo.data.level ?? -1) + 1 &&
      cardInfo.data.lrigType === currentLrigInfo.data.lrigType
    );
  });
}
