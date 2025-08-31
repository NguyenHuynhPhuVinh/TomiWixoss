// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore, GameState } from "../types";
import { Game } from "@/logic/models/game.model";

export interface GameSlice {
  game: Game | null;
  initializeGame: (initialState: GameState) => void;
  updateGame: (gameInstance: Game) => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set
) => ({
  game: null,

  initializeGame: (initialState) => {
    const gameInstance = new Game(initialState);
    set({ game: gameInstance });
  },

  // Action này rất quan trọng. Sau khi một Command thay đổi instance `game`,
  // nó sẽ gọi action này để cập nhật store và trigger re-render.
  updateGame: (gameInstance) => {
    // Tạo một instance mới để đảm bảo React nhận diện được sự thay đổi
    set({ game: new Game(gameInstance as any) });
  },
});
