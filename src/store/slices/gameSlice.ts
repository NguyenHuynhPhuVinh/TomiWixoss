// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
import { World } from "@/logic/ecs/world";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";
// XÓA: import { GameFactory } from "@/logic/ecs/game.factory";
import { CardData } from "@/types/game";
import shuffle from "shuffle-array";
import {
  GlobalStateComponent,
  ZoneComponent,
  CardInfoComponent,
  StatusComponent,
} from "@/logic/ecs/components/card.components";
import gameManager from "@/logic/ecs/game.manager";
import { CardInstance } from "@/types/game";
// === THÊM IMPORT MỚI ===
import { addCardImageUrlsToPreload } from "@/data/assetPreloader";
import { validateDeck } from "@/logic/deckValidation";

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
  syncStateFromWorld: (world: World) => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
) => ({
  initializeGame: async () => {
    // Tải dữ liệu deck từ file JSON
    const response = await fetch("/data/decks/diva-debut-deck.json");
    const fullDeckData: CardData[] = await response.json();

    // === BƯỚC 1: TRÍCH XUẤT URL VÀ ĐƯA VÀO PRELOADER ===
    const imageUrls = fullDeckData.map((card) => card.imageUrl);
    addCardImageUrlsToPreload(imageUrls);
    console.log(
      `%cĐã thêm ${imageUrls.length} URL hình ảnh vào hàng đợi preload.`,
      "color: #3498DB"
    );

    // === BƯỚC 2: TẠO DECK VÀ VALIDATE (như cũ) ===
    const mainDeckData = fullDeckData
      .filter((c) => c.backType === "MAIN")
      .flatMap((c) => Array(4).fill(c))
      .slice(0, 40);
    const lrigDeckData = fullDeckData.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );

    const validationResult = validateDeck(mainDeckData, lrigDeckData);

    if (!validationResult.isValid) {
      const errorString = validationResult.errors.join("\n- ");
      console.error("LỖI BỘ BÀI KHÔNG HỢP LỆ:\n- " + errorString);
      alert("Lỗi Bộ Bài Không Hợp Lệ:\n\n- " + errorString);
      return;
    }

    console.log("%cBộ bài hợp lệ. Bắt đầu khởi tạo game...", "color: #27AE60");

    // === BƯỚC 3: KHỞI TẠO GAME (như cũ) ===
    const newWorld = gameManager.createNewGame();
    shuffle(mainDeckData);
    gameManager.hydrateDeck(newWorld, mainDeckData, lrigDeckData);
    get().syncStateFromWorld(newWorld);
    gameManager.world = newWorld;
  },

  syncStateFromWorld: (world) => {
    const globalState = world.getComponent<GlobalStateComponent>(
      GLOBAL_ENTITY,
      "GlobalState"
    );

    // === TẠO VÀ CẬP NHẬT boardState ===
    const newBoardState: BoardState = {
      player: {
        signiZone: [null, null, null],
        lrigZone: [null, null, null],
      },
    };

    const entitiesOnField = world.query(["Zone", "CardInfo", "Status"]);
    for (const entity of entitiesOnField) {
      const zone = world.getComponent<ZoneComponent>(entity, "Zone")!;
      const cardInfo = world.getComponent<CardInfoComponent>(
        entity,
        "CardInfo"
      )!;
      const status = world.getComponent<StatusComponent>(entity, "Status")!;

      const cardInstance: CardInstance = {
        ...cardInfo.data,
        ...status,
        uuid: entity.toString(),
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
      world: world,
      worldVersion: state.worldVersion + 1,
      phase: globalState?.phase ?? state.phase,
      turn: globalState?.turn ?? state.turn,
      actionTakenInPhase:
        globalState?.actionTakenInPhase ?? state.actionTakenInPhase,
      boardState: newBoardState,
    }));
  },
});
