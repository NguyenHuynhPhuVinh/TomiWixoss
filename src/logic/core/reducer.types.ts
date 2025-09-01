// src/logic/core/reducer.types.ts
import { World } from "../ecs/world";
import { GameAction } from "./actions.types";
import { SystemDependencies } from "../ecs/ecs.types";
import { SideEffect } from "../ecs/components/card.components";

// Một Reducer là một hàm thay đổi draft state của Immer
export type Reducer<T extends GameAction = GameAction> = (
  draftWorld: World,
  payload: T["payload"]
) => void;

// Một Saga là một hàm gây ra hiệu ứng phụ sau khi Reducer đã chạy
export type Saga<T extends GameAction = GameAction> = (
  action: T,
  worldAfterReducer: World, // Nhận state SAU KHI đã được reducer cập nhật
  dependencies: SystemDependencies
) => SideEffect[] | void;
