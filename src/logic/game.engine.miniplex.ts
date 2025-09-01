// src/logic/game.engine.miniplex.ts

import useGameStore from "@/store/gameStore";
import { globalEntity } from "./ecs/world.miniplex";
import { upSystem } from "./ecs/systems/up.system.miniplex";
import { initializeScriptingSystem } from "./ecs/systems/scripting.system";
import { autoPhaseSystem } from "./ecs/systems/autoPhase.system.miniplex";
// import { drawSystem } from "./ecs/systems/draw.system.miniplex"; // Sẽ tạo sau

let animationFrameId: number;

// Các system chạy tự động mỗi frame
const loopSystems = [
  upSystem,
  autoPhaseSystem,
  // drawSystem,
];

function gameLoop() {
  // 1. Chạy các system tự động
  for (const system of loopSystems) {
    system();
  }

  // 2. Xử lý các side effect đã được tạo ra
  const { sideEffectQueue } = globalEntity;
  if (sideEffectQueue && sideEffectQueue.queue.length > 0) {
    const { addLog, setMustDiscard, openZoneViewer, closeZoneViewer } =
      useGameStore.getState();

    sideEffectQueue.queue.forEach((effect) => {
      switch (effect.type) {
        case "LOG":
          addLog(effect.message, effect.logType);
          break;
        case "UPDATE_UI_FLAG":
          // Xử lý cờ UI
          break;
      }
    });

    // Xóa queue sau khi đã xử lý
    sideEffectQueue.queue = [];
  }

  // 3. Đồng bộ state với Zustand để React render lại
  useGameStore.getState().syncStateFromWorld();

  // 4. Lặp lại
  animationFrameId = requestAnimationFrame(gameLoop);
}

export function startGameLoop() {
  console.log("Starting Miniplex Game Loop...");

  // Khởi tạo các system một lần
  initializeScriptingSystem();

  cancelAnimationFrame(animationFrameId); // Đảm bảo không có vòng lặp nào chạy song song
  gameLoop();
}
