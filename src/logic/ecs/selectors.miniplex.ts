// src/logic/ecs/selectors.miniplex.ts
import { GamePhase, Zone } from "@/logic/constants";
import { world } from "./world.miniplex";
import { Entity } from "./types.miniplex";

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
      const enterAbility = cardInfo.abilities?.find((a) => a.type === "Enter");
      if (!enterAbility?.timing?.includes(phase as any)) continue;
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

  return validEntities;
}
