// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore, GameState, GamePhase } from "../types";
import { Game } from "@/logic/models/game.model";
import { PlayerState } from "../types";

export interface GameSlice {
  game: Game | null;
  initializeGame: (initialState: GameState) => void;
  updateGame: (gameInstance: Game) => void;
  setPhase: (phase: GamePhase) => void;
  setPlayer: (player: PlayerState) => void;
  setAi: (ai: PlayerState) => void;
  getPlayer: () => PlayerState;
  getAi: () => PlayerState;
  drawCards: (amount: number) => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
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

  setPhase: (phase) => set({ phase }),

  setPlayer: (player) => set({ player }),

  setAi: (ai) => set({ ai }),

  getPlayer: () => get().player,

  getAi: () => get().ai,

  drawCards: (amount) => {
    const state = get();
    if (!state.game) return;
    const player = state.game.player;
    for (let i = 0; i < amount; i++) {
      const card = player.mainDeck.pop();
      if (card) {
        card.isFaceUp = true;
        player.hand.push(card);
      }
    }
    state.updateGame(state.game);
  },
});
