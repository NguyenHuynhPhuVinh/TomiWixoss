// src/logic/ecs/effects.types.ts
import { World } from "./world";
import { Entity } from "./ecs.types";

// "Hợp đồng" mà tất cả các logic hiệu ứng phải tuân theo
export interface IEffectResolver {
  resolve(world: World, payload: any): void;
}

// Cấu trúc của một hiệu ứng trên stack
export interface Effect {
  id: string; // Để debug
  sourceEntity: Entity; // Entity đã tạo ra hiệu ứng này
  type: string; // Ví dụ: 'DRAW_CARD', 'VANISH_SIGNI'
  payload: any;
}
