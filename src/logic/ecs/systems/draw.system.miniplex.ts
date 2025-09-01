// src/logic/ecs/systems/draw.system.miniplex.ts

import { globalEntity, world } from "../world.miniplex";
import { GamePhase, Zone } from "../../constants"; // <-- Import constants

// Helper function để lấy các lá bài trên cùng của bộ bài
function getTopCardsOfDeck(amount: number) {
  // Chuyển iterator thành mảng để sort
  const mainDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === Zone.MAIN_DECK) // <-- Sử dụng hằng số
  );

  // Sắp xếp để lá bài có index cao nhất (trên cùng) lên đầu mảng
  mainDeckEntities.sort((a, b) => b.zone.index - a.zone.index);

  return mainDeckEntities.slice(0, amount);
}

// Helper function để cập nhật lại index của bộ bài sau khi rút
function reindexDeck() {
  const mainDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === Zone.MAIN_DECK) // <-- Sử dụng hằng số
  );
  // Sắp xếp lại theo thứ tự tăng dần để gán lại index
  mainDeckEntities.sort((a, b) => a.zone.index - b.zone.index);
  mainDeckEntities.forEach((entity, i) => {
    entity.zone.index = i;
  });
}

// System chính
export function drawSystem() {
  const { globalState, sideEffectQueue } = globalEntity;

  // 1. Điều kiện để chạy System
  if (
    !globalState ||
    globalState.phase !== GamePhase.DRAW || // <-- Sử dụng hằng số
    globalState.actionTakenInPhase
  ) {
    return;
  }

  console.log("--- Running DrawSystem (Miniplex) ---");

  // 2. Xác định số lá bài cần rút
  const amountToDraw = globalState.turn === 1 ? 1 : 2;

  // 3. Lấy các lá bài cần rút
  const cardsToDraw = getTopCardsOfDeck(amountToDraw);

  if (cardsToDraw.length === 0) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.drawPhase.deckEmpty",
      logType: "system",
    });
  } else {
    // 4. Thực hiện logic rút bài
    cardsToDraw.forEach((entity) => {
      if (entity.zone && entity.status) {
        entity.zone.zone = Zone.HAND; // <-- Sử dụng hằng số
        entity.status.isFaceUp = true;
        entity.zone.index = 0; // Index không quan trọng trên tay
      }
    });

    // 5. Cập nhật lại index cho các lá còn lại trong bộ bài
    reindexDeck();

    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.drawPhase.drawCards",
      payload: { count: cardsToDraw.length },
      logType: "action",
    });
  }

  // 6. Đánh dấu phase đã hoàn thành
  globalState.actionTakenInPhase = true;
}
