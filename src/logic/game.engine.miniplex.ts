// src/logic/game.engine.miniplex.ts

import useGameStore from "@/store/gameStore";
import { globalEntity } from "./ecs/world.miniplex";
import { upSystem } from "./ecs/systems/up.system.miniplex";
import { initializeScriptingSystem } from "./ecs/systems/scripting.system";
import { autoPhaseSystem } from "./ecs/systems/autoPhase.system.miniplex";
import { drawSystem } from "./ecs/systems/draw.system.miniplex"; // <-- THÊM IMPORT
import { endPhaseSystem } from "./ecs/systems/endPhase.system.miniplex"; // <-- THÊM IMPORT
import { LogEntry } from "@/store/types";

let animationFrameId: number;

// Các system chạy tự động mỗi frame
const loopSystems = [
  upSystem,
  drawSystem, // <-- THÊM VÀO ĐÂY
  endPhaseSystem, // <-- THÊM VÀO ĐÂY
  autoPhaseSystem,
];

function gameLoop() {
  let worldHasChanged = false; // <-- 1. Thêm cờ theo dõi

  // 1. Chạy các system tự động
  for (const system of loopSystems) {
    system();
  }

  // 2. Xử lý các side effect đã được tạo ra
  const { sideEffectQueue } = globalEntity;
  if (sideEffectQueue && sideEffectQueue.queue.length > 0) {
    worldHasChanged = true; // <-- 2. Đánh dấu có thay đổi

    const { addLog, setMustDiscard, openZoneViewer, closeZoneViewer } =
      useGameStore.getState();

    sideEffectQueue.queue.forEach((effect) => {
      switch (effect.type) {
        case "LOG":
          // effect giờ là { type: 'LOG', key: '...', payload: {...}, logType: '...' }
          // Chúng ta cần truyền một object không có 'type'
          const { type, logType, ...logData } = effect;
          addLog({ ...logData, type: logType }); // Đổi tên logType thành type
          break;
        case "UPDATE_UI_FLAG":
          if (effect.flag === "mustDiscard") {
            setMustDiscard(effect.value);
          }
          if (effect.flag === "isZoneViewerOpen") {
            if (effect.value) {
              openZoneViewer();
            } else {
              closeZoneViewer();
            }
          }
          break;
      }
    });

    // Xóa queue sau khi đã xử lý
    sideEffectQueue.queue = [];
  }

  // 3. Chỉ cập nhật version nếu có thay đổi
  if (worldHasChanged) {
    useGameStore.getState().incrementWorldVersion();
  }

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
