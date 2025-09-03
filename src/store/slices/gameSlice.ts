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
    try {
      // 1. Tải file "manifest" của bộ bài
      const manifestResponse = await fetch("/data/decks/diva-debut-deck.json");
      const deckManifest = await manifestResponse.json();

      // Tạo một danh sách các ID duy nhất cần tải
      const mainDeckIds = deckManifest.mainDeck.map(
        (card: { id: string; count: number }) => card.id
      );
      const lrigDeckIds = deckManifest.lrigDeck.map(
        (card: { id: string; count: number }) => card.id
      );
      const allUniqueCardIds = [...new Set([...mainDeckIds, ...lrigDeckIds])];

      // 2. Tải song song tất cả các file JSON của từng lá bài
      const cardDataPromises = allUniqueCardIds.map((id) =>
        fetch(`/data/cards/${id}.json`).then((res) => res.json())
      );
      const cardDataArray: CardData[] = await Promise.all(cardDataPromises);

      // Chuyển mảng thành một Map để tra cứu nhanh hơn
      const cardDataMap = new Map<string, CardData>(
        cardDataArray.map((card) => [card.id, card])
      );

      // 3. TẢI VÀ HỢP NHẤT BẢN DỊCH (ĐÂY LÀ PHẦN THAY ĐỔI)
      const currentLang = i18n.language;
      let finalCardDataMap = cardDataMap; // Mặc định, dữ liệu cuối cùng là dữ liệu gốc (tiếng Anh)

      // Chỉ thực hiện tải và hợp nhất nếu ngôn ngữ không phải là 'en'
      if (currentLang !== "en") {
        console.log(
          `Language is '${currentLang}', attempting to load translations...`
        );
        try {
          const translationResponse = await fetch(
            `/locales/${currentLang}/cards.json`
          );
          if (translationResponse.ok) {
            const cardTranslations = await translationResponse.json();
            const translatedMap = new Map<string, CardData>();

            for (const [id, baseCard] of cardDataMap.entries()) {
              const translation = cardTranslations[id];
              if (translation) {
                // Hợp nhất bản dịch vào dữ liệu gốc
                const translatedCard = { ...baseCard };
                translatedCard.name = translation.name || baseCard.name;
                translatedCard.class = translation.class || baseCard.class;
                if (
                  translation.abilities &&
                  Array.isArray(translation.abilities)
                ) {
                  translatedCard.abilities =
                    baseCard.abilities?.map((ability, index) => ({
                      ...ability,
                      description:
                        translation.abilities[index]?.description ||
                        ability.description,
                    })) || [];
                }
                if (
                  translation.lifeBurstEffect &&
                  translatedCard.lifeBurstEffect
                ) {
                  translatedCard.lifeBurstEffect.description =
                    translation.lifeBurstEffect.description ||
                    translatedCard.lifeBurstEffect.description;
                }
                translatedMap.set(id, translatedCard);
              } else {
                translatedMap.set(id, baseCard); // Giữ lại card gốc nếu không có bản dịch
              }
            }
            finalCardDataMap = translatedMap; // Gán map đã được dịch làm dữ liệu cuối cùng
          }
        } catch (error) {
          console.error(
            `Could not load or parse translations for '${currentLang}'. Falling back to English.`,
            error
          );
        }
      }

      // 4. Xây dựng lại mảng dữ liệu deck hoàn chỉnh từ manifest và data đã tải
      const buildDeckFromManifest = (
        deckList: { id: string; count: number }[]
      ) => {
        const deck: CardData[] = [];
        for (const item of deckList) {
          const cardInfo = finalCardDataMap.get(item.id);
          if (cardInfo) {
            for (let i = 0; i < item.count; i++) {
              deck.push(cardInfo);
            }
          }
        }
        return deck;
      };

      const mainDeckData = buildDeckFromManifest(deckManifest.mainDeck);
      const lrigDeckData = buildDeckFromManifest(deckManifest.lrigDeck);

      // 5. Preload ảnh và nạp vào World (logic không đổi)
      const allImageUrls = [...finalCardDataMap.values()].map(
        (c) => c.imageUrl
      );
      addCardImageUrlsToPreload(allImageUrls);

      // 6. Xác thực bộ bài
      const validationResult = validateDeck(mainDeckData, lrigDeckData);

      if (!validationResult.isValid) {
        console.error(
          "================ DECK VALIDATION FAILED ================"
        );
        validationResult.errors.forEach((error) => console.error(`- ${error}`));
        console.error(
          "========================================================"
        );
        // Dừng việc khởi tạo game nếu bộ bài không hợp lệ
        return;
      }

      console.log("Deck validation successful!");

      world.clear();

      // Hàm helper để biến CardData thành Entity của Miniplex
      const createCardEntity = (
        cardData: CardData,
        zoneName: Zone,
        index: number
      ): Entity => ({
        uuid: uuidv4(),
        cardInfo: { data: cardData },
        status: { isFaceUp: false, isDowned: false },
        zone: { owner: "player", zone: zoneName, index: index },
      });

      // Nạp main deck
      shuffle(mainDeckData);
      mainDeckData.forEach((card, index) => {
        world.add(createCardEntity(card, Zone.MAIN_DECK, index));
      });

      // Nạp lrig deck
      lrigDeckData.forEach((card, index) => {
        world.add(createCardEntity(card, Zone.LRIG_DECK, index));
      });

      // Thêm lại globalEntity sau khi clear
      const { globalEntity } = await import("@/logic/ecs/world.miniplex");
      globalEntity.globalState!.phase = GamePhase.PRE_GAME;
      world.add(globalEntity);

      console.log(
        `Miniplex World hydrated with translated data for language: ${currentLang}`
      );
      get().incrementWorldVersion();
    } catch (error) {
      console.error("Failed to initialize game with new architecture:", error);
    }
  },

  // === THAY ĐỔI: Hàm syncStateFromWorld được thay thế hoàn toàn ===
  incrementWorldVersion: () => {
    set((state) => ({ worldVersion: state.worldVersion + 1 }));
  },
});
