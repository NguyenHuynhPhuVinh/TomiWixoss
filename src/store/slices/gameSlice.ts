// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
// import { World } from "@/logic/ecs/world";
// import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";
// XÓA: import { GameFactory } from "@/logic/ecs/game.factory";
import { CardData, ZoneKey } from "@/types/game";
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
  syncStateFromWorld: () => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
) => ({
  initializeGame: async () => {
    // Tải dữ liệu deck từ file JSON (giữ nguyên)
    const response = await fetch("/data/decks/diva-debut-deck.json");
    const fullDeckData: CardData[] = await response.json();

    // Preload ảnh (giữ nguyên)
    const imageUrls = fullDeckData.map((card) => card.imageUrl);
    addCardImageUrlsToPreload(imageUrls);

    // Tạo deck và validate (giữ nguyên)
    const mainDeckData = fullDeckData
      .filter((c) => c.backType === "MAIN")
      .flatMap((c) => Array(4).fill(c))
      .slice(0, 40);
    const lrigDeckData = fullDeckData.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );
    // ... validation logic ...

    // === PHẦN THAY ĐỔI LỚN: NẠP DỮ LIỆU VÀO MINIPLEX WORLD ===

    // Xóa tất cả các entity cũ (trừ global) để chuẩn bị cho game mới
    world.clear();

    // Hàm helper để biến CardData thành Entity của Miniplex
    const createCardEntity = (
      cardData: CardData,
      zoneName: ZoneKey,
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
      world.add(createCardEntity(card, "mainDeck", index));
    });

    // Nạp lrig deck
    lrigDeckData.forEach((card, index) => {
      world.add(createCardEntity(card, "lrigDeck", index));
    });

    // Thêm lại globalEntity sau khi clear
    const { globalEntity } = await import("@/logic/ecs/world.miniplex");
    globalEntity.globalState!.phase = "pre_game"; // Reset phase
    world.add(globalEntity);

    console.log(`Miniplex World hydrated with ${world.size} entities.`);

    // Đồng bộ state lần đầu
    get().syncStateFromWorld();
  },

  syncStateFromWorld: () => {
    const globalState = globalEntity.globalState;

    // === TẠO VÀ CẬP NHẬT boardState ===
    const newBoardState: BoardState = {
      player: {
        signiZone: [null, null, null],
        lrigZone: [null, null, null],
      },
    };

    const entitiesOnField = world.with("zone", "cardInfo", "status");
    for (const entity of entitiesOnField) {
      const zone = entity.zone!;
      const cardInfo = entity.cardInfo!;
      const status = entity.status!;

      const cardInstance: CardInstance = {
        ...cardInfo.data,
        ...status,
        uuid: entity.uuid,
        owner: zone.owner,
      };

      if (zone.zone === "signiZone") {
        newBoardState.player.signiZone[zone.index] = cardInstance;
      }
      if (zone.zone === "lrigZone") {
        newBoardState.player.lrigZone[zone.index] = cardInstance;
      }
    }
    // ===================================

    set((state) => ({
      // world: world, // Không cần set world vì nó là global trong Miniplex
      worldVersion: state.worldVersion + 1,
      phase: globalState?.phase ?? state.phase,
      turn: globalState?.turn ?? state.turn,
      actionTakenInPhase:
        globalState?.actionTakenInPhase ?? state.actionTakenInPhase,
      boardState: newBoardState,
    }));
  },
});
