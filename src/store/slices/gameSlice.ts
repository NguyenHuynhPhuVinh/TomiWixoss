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
    // GameManager sẽ tự quản lý factory của nó
    const newWorld = gameManager.createNewGame();

    // Tải dữ liệu deck từ file JSON
    const response = await fetch("/data/decks/diva-debut-deck.json");
    const deck: CardData[] = await response.json();

    const mainDeckData = deck
      .filter((c) => c.backType === "MAIN")
      .flatMap((c) => Array(4).fill(c))
      .slice(0, 40);
    const lrigDeckData = deck.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );
    shuffle(mainDeckData);

    // Nạp dữ liệu vào World
    gameManager.hydrateDeck(newWorld, mainDeckData, lrigDeckData);

    get().syncStateFromWorld(newWorld);
    gameManager.world = newWorld; // Cập nhật world trong manager
    gameManager.startLoop();
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
