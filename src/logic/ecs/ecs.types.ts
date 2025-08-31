// src/logic/ecs/ecs.types.ts
import type { World } from "./world";

// Một Entity chỉ đơn giản là một ID duy nhất.
export type Entity = number;

// Một "constructor" của Component, dùng để định danh loại Component.
export type ComponentClass<T extends Component> = new (...args: any[]) => T;

// Interface cơ bản mà tất cả các Component sẽ kế thừa (hiện tại rỗng).
export interface Component {}

// Interface cơ bản mà tất cả các System phải tuân theo.
export interface System {
  // Hàm update sẽ được gọi trong mỗi vòng lặp game.
  update(world: World): void;
}
