// src/logic/ecs/selectors.miniplex.ts
import { GamePhase } from "@/types/game";
import { world } from "./world.miniplex";
import { Entity } from "./types.miniplex";

export function getValidGrowOptions(
  phase: GamePhase,
  zoneIndex: number
): Entity[] {
  const lrigsOnField = world.with("cardInfo", "zone");

  let centerLrigEntity: Entity | undefined;
  for (const e of lrigsOnField) {
    if (e.zone.zone === "lrigZone" && e.zone.index === 1) {
      centerLrigEntity = e;
      break;
    }
  }
  if (!centerLrigEntity) return [];

  let currentLrigEntity: Entity | undefined;
  for (const e of lrigsOnField) {
    if (e.zone.zone === "lrigZone" && e.zone.index === zoneIndex) {
      currentLrigEntity = e;
      break;
    }
  }
  if (!currentLrigEntity) return [];

  const centerLrigLevel = centerLrigEntity.cardInfo!.data.level ?? 0;
  const currentLrigInfo = currentLrigEntity.cardInfo!.data;

  const lrigDeckEntities = world
    .with("cardInfo", "zone")
    .where((e) => e.zone.zone === "lrigDeck");

  const validEntities: Entity[] = [];
  for (const entity of lrigDeckEntities) {
    const cardInfo = entity.cardInfo!.data;
    const isCenterGrow = zoneIndex === 1;

    // Kiểm tra timing
    if (isCenterGrow) {
      if (phase !== "grow") continue;
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
