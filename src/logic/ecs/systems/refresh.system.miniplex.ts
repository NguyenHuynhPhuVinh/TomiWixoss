// src/logic/ecs/systems/refresh.system.miniplex.ts

import { world, globalEntity } from "../world.miniplex";
import { Zone } from "../../constants";
import { shuffleMainDeck } from "../utils.miniplex";
import { Entity } from "../types.miniplex";

export function refreshSystem() {
  // 1. Kiểm tra điều kiện kích hoạt: Main Deck phải rỗng
  const mainDeckEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === Zone.MAIN_DECK)
  );

  if (mainDeckEntities.length > 0) {
    return;
  }

  // 2. Lấy các lá bài trong Mộ (Trash)
  const trashEntities = Array.from(
    world.with("zone").where((e) => e.zone.zone === Zone.TRASH)
  );

  if (trashEntities.length === 0) {
    return;
  }

  console.log("--- Running RefreshSystem (Miniplex) ---");
  const { sideEffectQueue } = globalEntity;

  // 3. Thông báo cho người chơi
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.refresh.deck",
    logType: "system",
  });

  // 4. Chuyển tất cả bài từ Mộ về Main Deck và LẬT ÚP CHÚNG XUỐNG
  for (const entity of trashEntities) {
    // Đảm bảo entity có đủ các component cần thiết
    if (entity.zone && entity.status) {
      entity.zone.zone = Zone.MAIN_DECK;
      entity.status.isFaceUp = false; // <-- THAY ĐỔI QUAN TRỌNG: Bài về deck phải úp xuống
    }
  }

  // 5. Xáo lại bộ bài mới
  shuffleMainDeck();

  // 6. Xử lý Phạt Refresh (bỏ 1 Life Cloth)
  const lifeClothEntities = Array.from(
    world
      .with("zone", "cardInfo", "status") // Thêm 'status' vào query
      .where((e) => e.zone.zone === Zone.LIFE_CLOTH)
  );

  if (lifeClothEntities.length > 0) {
    lifeClothEntities.sort((a, b) => a.zone.index - b.zone.index);
    const topLifeCloth = lifeClothEntities.pop();

    if (topLifeCloth && topLifeCloth.zone && topLifeCloth.status) {
      const currentTrashSize = Array.from(
        world.with("zone").where((e) => e.zone.zone === Zone.TRASH)
      ).length;

      // Chuyển lá bài vào mộ
      topLifeCloth.zone.zone = Zone.TRASH;
      topLifeCloth.zone.index = currentTrashSize;
      topLifeCloth.status.isFaceUp = true; // <-- THAY ĐỔI QUAN TRỌNG: Lá bài vào Mộ luôn ngửa lên

      sideEffectQueue?.queue.push({
        type: "LOG",
        key: "logs.refresh.penalty",
        payload: { cardName: topLifeCloth.cardInfo!.data.name },
        logType: "cost",
      });
    }
  } else {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.refresh.noPenalty",
      logType: "info",
    });
  }
}
