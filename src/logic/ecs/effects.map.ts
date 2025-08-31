// src/logic/ecs/effects.map.ts
import { IEffectResolver } from "./effects.types";
import { DrawCardEffect } from "./effects/drawCard.effect";

// Map từ tên hiệu ứng -> logic xử lý của nó
export const effectResolverMap: Record<string, IEffectResolver> = {
  DRAW_CARD: new DrawCardEffect(),
  // Thêm các hiệu ứng khác ở đây
};
