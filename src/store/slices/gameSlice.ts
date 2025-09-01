// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
// import { World } from "@/logic/ecs/world";
// import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";
// XÓA: import { GameFactory } from "@/logic/ecs/game.factory";
import { CardData } from "@/types/game";
import shuffle from "shuffle-array";
// import {
//   GlobalStateComponent,
//   ZoneComponent,
//   CardInfoComponent,
//   StatusComponent,
// } from "@/logic/ecs/components/card.components";
// import gameManager from "@/logic/ecs/game.manager";
import { CardInstance } from "@/types/game";
// === THÊM IMPORT MỚI ===
import { addCardImageUrlsToPreload } from "@/data/assetPreloader";
import { validateDeck } from "@/logic/deckValidation";
import { world, globalEntity } from "@/logic/ecs/world.miniplex"; // <-- Sửa import
import { Entity } from "@/logic/ecs/types.miniplex"; // <-- Sửa import
import { v4 as uuidv4 } from "uuid"; // <-- Thêm import để tạo UUID
// === THAY ĐỔI: Import hằng số mới ===
import { Zone, GamePhase } from "@/logic/constants";
import i18n from "@/i18n"; // Import instance i18next

// Định nghĩa một kiểu đơn giản cho trạng thái bàn đấu
export interface BoardState {
  player: {
    signiZone: (CardInstance | null)[];
    lrigZone: (CardInstance | null)[];
    // Thêm các zone khác nếu cần
  };
}

export interface GameSlice {
  initializeGame: () => void;
  incrementWorldVersion: () => void; // <-- THAY ĐỔI
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
) => ({
  initializeGame: async () => {
    // 1. Tải dữ liệu deck gốc (chứa thông tin không đổi và text tiếng Anh làm fallback)
    const response = await fetch("/data/decks/diva-debut-deck.json");
    const fullDeckData: CardData[] = await response.json();

    // 2. Lấy ngôn ngữ hiện tại và tải file dịch tương ứng
    const currentLang = i18n.language;
    let cardTranslations: Record<string, any> = {};
    try {
      const translationResponse = await fetch(
        `/locales/${currentLang}/cards.json`
      );
      if (translationResponse.ok) {
        cardTranslations = await translationResponse.json();
      }
    } catch (error) {
      console.error(
        `Could not load card translations for ${currentLang}`,
        error
      );
    }

    // 3. Hợp nhất dữ liệu gốc và dữ liệu dịch
    const translatedDeckData = fullDeckData.map((card) => {
      const translation = cardTranslations[card.id];
      if (translation) {
        // Tạo một bản sao của card để không thay đổi dữ liệu gốc
        const newCard = { ...card };
        // Ghi đè các trường văn bản
        newCard.name = translation.name || card.name;
        newCard.class = translation.class || card.class;
        // Ghi đè mô tả năng lực
        if (translation.abilities && Array.isArray(translation.abilities)) {
          newCard.abilities =
            card.abilities?.map((ability, index) => ({
              ...ability,
              description:
                translation.abilities[index]?.description ||
                ability.description,
            })) || [];
        }
        return newCard;
      }
      return card; // Trả về card gốc nếu không có bản dịch
    });

    // 4. Preload ảnh (giữ nguyên)
    const imageUrls = translatedDeckData.map((card) => card.imageUrl);
    addCardImageUrlsToPreload(imageUrls);

    // 5. Tạo deck và nạp vào Miniplex World (sử dụng dữ liệu đã dịch)
    const mainDeckData = translatedDeckData
      .filter((c) => c.backType === "MAIN")
      .flatMap((c) => Array(4).fill(c))
      .slice(0, 40);
    const lrigDeckData = translatedDeckData.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );

    // ... validation logic (giữ nguyên)

    world.clear();

    // Hàm helper để biến CardData thành Entity của Miniplex
    const createCardEntity = (
      cardData: CardData,
      zoneName: Zone, // <-- Sử dụng type mới
      index: number
    ): Entity => ({
      uuid: uuidv4(), // Mỗi lá bài trong game có một uuid duy nhất
      cardInfo: { data: cardData },
      status: { isFaceUp: false, isDowned: false },
      zone: { owner: "player", zone: zoneName, index: index },
    });

    // Nạp main deck
    shuffle(mainDeckData);
    mainDeckData.forEach((card, index) => {
      world.add(createCardEntity(card, Zone.MAIN_DECK, index)); // <-- Sử dụng hằng số
    });

    // Nạp lrig deck
    lrigDeckData.forEach((card, index) => {
      world.add(createCardEntity(card, Zone.LRIG_DECK, index)); // <-- Sử dụng hằng số
    });

    // Thêm lại globalEntity sau khi clear
    const { globalEntity } = await import("@/logic/ecs/world.miniplex");
    globalEntity.globalState!.phase = GamePhase.PRE_GAME; // <-- Sử dụng hằng số
    world.add(globalEntity);

    console.log(
      `Miniplex World hydrated with translated data for language: ${currentLang}`
    );
    get().incrementWorldVersion();
  },

  // === THAY ĐỔI: Hàm syncStateFromWorld được thay thế hoàn toàn ===
  incrementWorldVersion: () => {
    set((state) => ({ worldVersion: state.worldVersion + 1 }));
  },
});
