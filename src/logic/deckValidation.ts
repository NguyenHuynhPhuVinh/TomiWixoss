// src/logic/deckValidation.ts
import { CardData } from "@/types/game";

interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Xác thực một bộ bài (Main Deck và LRIG Deck) dựa trên các quy tắc của game.
 * @param mainDeckData Mảng dữ liệu thô của các lá bài trong Main Deck.
 * @param lrigDeckData Mảng dữ liệu thô của các lá bài trong LRIG Deck.
 * @returns Một object cho biết bộ bài có hợp lệ hay không và danh sách các lỗi.
 */
export function validateDeck(
  mainDeckData: CardData[],
  lrigDeckData: CardData[]
): DeckValidationResult {
  const errors: string[] = [];

  // 1. Kiểm tra số lượng Main Deck (phải là 40)
  if (mainDeckData.length !== 40) {
    errors.push(
      `Main Deck phải có đúng 40 lá, hiện tại có ${mainDeckData.length}.`
    );
  }

  // 2. Kiểm tra số lượng LRIG Deck (tối đa 12)
  if (lrigDeckData.length > 12) {
    errors.push(
      `LRIG Deck không được có quá 12 lá, hiện tại có ${lrigDeckData.length}.`
    );
  }

  // 3. Kiểm tra số lượng bản sao trong Main Deck (tối đa 4)
  const mainDeckCounts: { [id: string]: number } = {};
  mainDeckData.forEach((card) => {
    mainDeckCounts[card.id] = (mainDeckCounts[card.id] || 0) + 1;
  });

  for (const cardId in mainDeckCounts) {
    if (mainDeckCounts[cardId] > 4) {
      const cardName =
        mainDeckData.find((c) => c.id === cardId)?.name || cardId;
      errors.push(
        `Lá bài "${cardName}" (${cardId}) có ${mainDeckCounts[cardId]} bản sao trong Main Deck (tối đa 4).`
      );
    }
  }

  // 4. Kiểm tra số lượng bản sao trong LRIG Deck (tối đa 1, trừ PIECE)
  const lrigDeckCounts: { [id: string]: number } = {};
  lrigDeckData.forEach((card) => {
    if (card.type !== "PIECE") {
      // PIECE có thể có nhiều bản sao, các loại khác thì không
      lrigDeckCounts[card.id] = (lrigDeckCounts[card.id] || 0) + 1;
    }
  });

  for (const cardId in lrigDeckCounts) {
    if (lrigDeckCounts[cardId] > 1) {
      const cardName =
        lrigDeckData.find((c) => c.id === cardId)?.name || cardId;
      errors.push(
        `Lá bài "${cardName}" (${cardId}) có ${lrigDeckCounts[cardId]} bản sao trong LRIG Deck (tối đa 1).`
      );
    }
  }

  // 5. Kiểm tra điều kiện LRIG ban đầu: ít nhất 3 LRIG Level 0
  const level0Lrigs = lrigDeckData.filter(
    (c) => c.level === 0 && (c.type === "LRIG" || c.type === "ASSIST LRIG")
  );
  if (level0Lrigs.length < 3) {
    errors.push(
      `LRIG Deck phải có ít nhất 3 LRIG Level 0, hiện tại có ${level0Lrigs.length}.`
    );
  }

  // 6. Kiểm tra chỉ có một dòng Center LRIG
  let centerLrigLines = 0;
  for (const lrig of level0Lrigs) {
    const hasLevel3 = lrigDeckData.some(
      (evo) => evo.lrigType === lrig.lrigType && evo.level === 3
    );
    if (hasLevel3) {
      centerLrigLines++;
    }
  }
  if (centerLrigLines !== 1) {
    errors.push(
      `LRIG Deck phải có chính xác 1 dòng Center LRIG (tiến hóa lên Lv 3), đã tìm thấy ${centerLrigLines}.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
