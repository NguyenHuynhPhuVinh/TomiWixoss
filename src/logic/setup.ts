// src/logic/setup.ts
import { CardInstance } from "@/types/game";

interface InitialLrigSetup {
  centerLrig: CardInstance | null;
  assistLrigs: (CardInstance | null)[];
  remainingDeck: CardInstance[];
}

/**
 * Tự động tìm 3 LRIG ban đầu từ một LRIG Deck hoàn chỉnh.
 * @param fullLrigDeck Mảng chứa tất cả các lá bài trong LRIG Deck.
 * @returns Một object chứa Center LRIG, 2 Assist LRIG, và bộ bài còn lại.
 */
export function findInitialLrigs(
  fullLrigDeck: CardInstance[]
): InitialLrigSetup {
  // 1. Tìm tất cả các LRIG Level 0
  const level0Lrigs = fullLrigDeck.filter(
    (c) => c.level === 0 && (c.type === "LRIG" || c.type === "ASSIST LRIG")
  );

  // 2. Tìm Center LRIG: là LRIG Level 0 duy nhất có dòng tiến hóa lên Level 3
  let centerLrig: CardInstance | undefined;
  for (const lrig of level0Lrigs) {
    // Kiểm tra xem có lá bài nào khác trong deck cùng lrigType và có level 3 không
    const hasLevel3Evolution = fullLrigDeck.some(
      (evoCard) => evoCard.lrigType === lrig.lrigType && evoCard.level === 3
    );
    if (hasLevel3Evolution) {
      centerLrig = lrig;
      break; // Tìm thấy rồi thì dừng lại
    }
  }

  // 3. Kiểm tra điều kiện hợp lệ
  if (!centerLrig || level0Lrigs.length < 3) {
    console.error(
      "LRIG Deck không hợp lệ: Không tìm thấy đủ 3 LRIG Level 0 hoặc không xác định được Center LRIG."
    );
    // Trả về trạng thái lỗi để không làm sập game
    return {
      centerLrig: null,
      assistLrigs: [null, null],
      remainingDeck: fullLrigDeck,
    };
  }

  // 4. Các lá Level 0 còn lại là Assist LRIG
  const assistLrigs = level0Lrigs.filter((c) => c.uuid !== centerLrig?.uuid);

  // 5. Lọc ra bộ bài còn lại
  const initialUuids = [centerLrig.uuid, ...assistLrigs.map((c) => c.uuid)];
  const remainingDeck = fullLrigDeck.filter(
    (c) => !initialUuids.includes(c.uuid)
  );

  return {
    centerLrig,
    assistLrigs: [assistLrigs[0] || null, assistLrigs[1] || null],
    remainingDeck,
  };
}
