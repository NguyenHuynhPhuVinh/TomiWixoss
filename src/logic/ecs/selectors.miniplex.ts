// src/logic/ecs/selectors.miniplex.ts
import { GamePhase, Zone } from "@/logic/constants";
import { world } from "./world.miniplex";
import { Entity } from "./types.miniplex";
import { checkCost } from "@/logic/payment"; // <-- THÊM IMPORT 1
import { CardInstance } from "@/types/game"; // <-- THÊM IMPORT 2

export function getValidGrowOptions(
  phase: GamePhase,
  zoneIndex: number
): Entity[] {
  const lrigsOnField = world.with("cardInfo", "zone");

  let centerLrigEntity: Entity | undefined;
  for (const e of lrigsOnField) {
    if (e.zone.zone === Zone.LRIG_ZONE && e.zone.index === 1) {
      // <-- Sử dụng hằng số
      centerLrigEntity = e;
      break;
    }
  }
  if (!centerLrigEntity) return [];

  let currentLrigEntity: Entity | undefined;
  for (const e of lrigsOnField) {
    if (e.zone.zone === Zone.LRIG_ZONE && e.zone.index === zoneIndex) {
      // <-- Sử dụng hằng số
      currentLrigEntity = e;
      break;
    }
  }
  if (!currentLrigEntity) return [];

  const centerLrigLevel = centerLrigEntity.cardInfo!.data.level ?? 0;
  const currentLrigInfo = currentLrigEntity.cardInfo!.data;

  // === THAY ĐỔI BẮT ĐẦU TỪ ĐÂY ===

  // 1. Lấy trạng thái hiện tại của Ener Zone
  const enerZoneEntities = world
    .with("cardInfo", "status", "zone", "uuid")
    .where((e) => e.zone.zone === Zone.ENER_ZONE);

  // Chuyển đổi các entity thành định dạng CardInstance mà hàm checkCost cần
  const enerZoneCards: CardInstance[] = Array.from(enerZoneEntities).map(
    (e) => ({
      ...e.cardInfo!.data,
      ...e.status!,
      uuid: e.uuid,
      owner: e.zone!.owner,
    })
  );

  // === KẾT THÚC THAY ĐỔI ===

  const lrigDeckEntities = world
    .with("cardInfo", "zone")
    .where((e) => e.zone.zone === Zone.LRIG_DECK); // <-- Sử dụng hằng số

  const validEntities: Entity[] = [];
  for (const entity of lrigDeckEntities) {
    const cardInfo = entity.cardInfo!.data;
    const isCenterGrow = zoneIndex === 1;

    // Kiểm tra timing
    if (isCenterGrow) {
      if (phase !== GamePhase.GROW) continue; // <-- Sử dụng hằng số
    } else {
      // =================== ĐOẠN CODE CẦN SỬA ===================

      // Code cũ (gây lỗi):
      // if (!cardInfo.timing?.includes(phase as any)) continue;

      // Code mới (đã sửa lỗi phân biệt hoa-thường):
      const hasValidTiming = cardInfo.timing?.some((t) =>
        t.toLowerCase().startsWith(phase)
      );
      if (!hasValidTiming) {
        continue;
      }

      // ==========================================================
    }

    // Kiểm tra level của Assist LRIG so với Center
    if (!isCenterGrow) {
      if ((cardInfo.level ?? 0) > centerLrigLevel) continue;
    }

    // Kiểm tra level và lrigType
    if (
      cardInfo.level === (currentLrigInfo.level ?? -1) + 1 &&
      cardInfo.lrigType === currentLrigInfo.lrigType
    ) {
      validEntities.push(entity);
    }
  }

  // === THAY ĐỔI BẮT ĐẦU TỪ ĐÂY ===

  // 2. Lọc danh sách các lá bài hợp lệ dựa trên chi phí Ener có thể trả
  const affordableEntities = validEntities.filter((entity) => {
    const growCost = entity.cardInfo!.data.growCost;
    // Sử dụng hàm checkCost để xem người chơi có đủ Ener không
    return checkCost(growCost, enerZoneCards).canPay;
  });

  return affordableEntities; // Chỉ trả về những lựa chọn có thể chi trả

  // === KẾT THÚC THAY ĐỔI ===
}
