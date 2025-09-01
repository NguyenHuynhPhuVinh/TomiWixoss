// src/logic/ecs/world.miniplex.ts

import { World } from "miniplex";
import { Entity } from "./types.miniplex"; // Import từ file types mới

// 1. Tạo và export một instance duy nhất của World
export const world = new World<Entity>();

// 2. Tạo một entity đặc biệt để chứa state toàn cục
export const globalEntity: Entity = {
  uuid: "global", // ID đặc biệt
  isGlobal: true, // Tag để dễ tìm
  globalState: {
    phase: "pre_game",
    turn: 0,
    actionTakenInPhase: false,
    mulliganSelection: [],
    playerAction: null, // <-- THÊM DÒNG NÀY
  },
  sideEffectQueue: {
    queue: [],
  },
};

// 3. Thêm entity toàn cục vào world
world.add(globalEntity);
