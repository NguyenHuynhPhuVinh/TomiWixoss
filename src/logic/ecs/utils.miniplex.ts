// src/logic/ecs/utils.miniplex.ts

import { world } from "./world.miniplex";
import { Entity } from "./types.miniplex";
import shuffle from "shuffle-array";

/**
 * Lấy một số lá bài từ trên cùng bộ bài chính.
 * @param amount Số lượng lá bài cần lấy.
 * @returns Mảng các Entity từ trên cùng deck.
 */
export function getTopCardsOfDeck(amount: number): Entity[] {
  const mainDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === "mainDeck")
  );

  mainDeckEntities.sort((a, b) => b.zone.index - a.zone.index);
  return mainDeckEntities.slice(0, amount);
}

/**
 * Cập nhật lại chỉ số index cho các lá bài trong bộ bài chính.
 */
export function reindexDeck() {
  const mainDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === "mainDeck")
  );
  mainDeckEntities.sort((a, b) => a.zone.index - b.zone.index);
  mainDeckEntities.forEach((entity, i) => {
    if (entity.zone) {
      entity.zone.index = i;
    }
  });
}

/**
 * Rút một số lá bài khởi đầu vào tay.
 * @param amount Số lượng lá bài cần rút.
 */
export function drawInitialHand(amount: number) {
  const cardsToDraw = getTopCardsOfDeck(amount);
  cardsToDraw.forEach((entity) => {
    if (entity.zone && entity.status) {
      entity.zone.zone = "hand";
      entity.status.isFaceUp = true;
      entity.zone.index = 0; // index không quan trọng trong tay
    }
  });
  reindexDeck();
}

/**
 * Xáo trộn bộ bài chính.
 */
export function shuffleMainDeck() {
  const mainDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === "mainDeck")
  );
  shuffle(mainDeckEntities);
  mainDeckEntities.forEach((entity, i) => {
    entity.zone.index = i;
  });
}

/**
 * Cập nhật lại chỉ số index cho các lá bài trong bộ bài LRIG.
 */
export function reindexLrigDeck() {
  const lrigDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === "lrigDeck")
  );
  // Sắp xếp lại theo thứ tự index hiện tại để đảm bảo tính nhất quán
  lrigDeckEntities.sort((a, b) => a.zone.index - b.zone.index);
  // Gán lại index mới tuần tự từ 0
  lrigDeckEntities.forEach((entity, i) => {
    if (entity.zone) {
      entity.zone.index = i;
    }
  });
}
