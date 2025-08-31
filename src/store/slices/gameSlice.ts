// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
import { World } from "@/logic/ecs/world";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";
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
  _syncStateFromWorld: (world: World) => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
) => ({
  initializeGame: () => {
    const newWorld = gameManager.createNewGame();
    get()._syncStateFromWorld(newWorld);
    gameManager.startLoop();
  },

  _syncStateFromWorld: (world) => {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);

    // === TẠO VÀ CẬP NHẬT boardState ===
    const newBoardState: BoardState = {
      player: {
        signiZone: [null, null, null],
        lrigZone: [null, null, null],
      },
    };

    const entitiesOnField = world.query([
      ZoneComponent,
      CardInfoComponent,
      StatusComponent,
    ]);
    for (const entity of entitiesOnField) {
      const zone = world.getComponent(entity, ZoneComponent)!;
      const cardInfo = world.getComponent(entity, CardInfoComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;

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
