// src/store/gameStore.ts
import { create } from "zustand";
import { createLogSlice } from "./slices/logSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createUiSlice } from "./slices/uiSlice";
import { GameStore } from "./types";
import gameManager from "@/logic/ecs/game.manager";

const useGameStore = create<GameStore>((set, get) => {
  gameManager.onUpdate((updatedWorld) => {
    get()._syncStateFromWorld(updatedWorld);
  });

  return {
    world: null,
    worldVersion: 0,
    phase: "pre_game",
    turn: 0,
    actionTakenInPhase: false,
    boardState: {
      player: { signiZone: [null, null, null], lrigZone: [null, null, null] },
    },

    ...createLogSlice(set, get, {} as any),
    ...createGameSlice(set, get, {} as any),
    ...createUiSlice(set, get, {} as any),
  };
});

export default useGameStore;
