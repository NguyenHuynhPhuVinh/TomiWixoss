// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { GameStore, GameState, GamePhase } from "../types";
import { Game } from "@/logic/models/game.model";
import { PlayerState } from "../types";

export interface GameSlice {
  game: Game | null;
  initializeGame: (initialState: GameState) => void;
  updateGame: (gameInstance: Game) => void;
  // Xóa các action không cần thiết
  // setPhase: (phase: GamePhase) => void;
  // setPlayer: (player: PlayerState) => void;
  // setAi: (ai: PlayerState) => void;
  // getPlayer: () => PlayerState;
  // getAi: () => PlayerState;
  // drawCards: (amount: number) => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
) => ({
  game: null,

  initializeGame: (initialState) => {
    const gameInstance = new Game(initialState);
    // Khi khởi tạo, chúng ta cũng đồng bộ hóa state lần đầu tiên
    set({
      game: gameInstance,
      // Cập nhật các state cấp cao
      phase: gameInstance.phase,
      turn: gameInstance.turn,
      player: gameInstance.player,
      ai: gameInstance.ai,
      actionTakenInPhase: gameInstance.actionTakenInPhase,
      gameStarted: true,
    });
  },

  updateGame: (gameInstance) => {
    // Tạo một instance mới để đảm bảo React nhận diện được sự thay đổi
    const newGameInstance = new Game(gameInstance as any);
    // Mỗi khi cập nhật, lại đồng bộ hóa state
    set({
      game: newGameInstance,
      // Cập nhật các state cấp cao
      phase: newGameInstance.phase,
      turn: newGameInstance.turn,
      player: newGameInstance.player,
      ai: newGameInstance.ai,
      actionTakenInPhase: newGameInstance.actionTakenInPhase,
    });
  },

  // Các action khác đã được xóa vì updateGame đã đảm nhiệm
});
