// src/logic/ecs/ecs.types.ts
import type { World } from "./world";
import eventBus from "../core/event.bus";
import gameManager from "./game.manager"; // Thêm import gameManager

// Một Entity chỉ đơn giản là một ID duy nhất.
export type Entity = number;

// Một "constructor" của Component, dùng để định danh loại Component.
export type ComponentClass<T extends Component> = new (...args: any[]) => T;

// Interface cơ bản mà tất cả các Component sẽ kế thừa (hiện tại rỗng).
export interface Component {}

// Định nghĩa các dependency mà System có thể cần
export interface SystemDependencies {
  eventBus: typeof eventBus;
  gameManager: typeof gameManager;
  // Thêm các dependency khác ở đây sau này, ví dụ: soundManager, networkManager
}

// Interface cơ bản mà tất cả các System phải tuân theo.
export interface System {
  // Thêm phương thức setup để nhận dependency
  setup?(dependencies: SystemDependencies): void;
  // Hàm update sẽ được gọi trong mỗi vòng lặp game và thay đổi trực tiếp trên world
  update(world: World): void;
}
