// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";

interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  // Thêm các zone khác sau: hand, enerZone, signiZone, trash...
}

interface GameState {
  isInitialized: boolean; // <-- THÊM CỜ NÀY
  turn: number;
  phase: "draw" | "ener" | "main" | "attack" | "end";
  playerEner: number;
  player: PlayerState;
  ai: PlayerState;
  increaseTurn: () => void;
  setPlayerEner: (amount: number) => void;
  initializeGame: () => void;
}

// Hàm helper để tạo một instance từ card data
const createCardInstance = (
  cardData: CardData,
  owner: "player" | "ai"
): CardInstance => ({
  ...cardData,
  uuid: uuidv4(),
  isFaceUp: false,
  isDowned: false,
  owner,
});

const useGameStore = create<GameState>((set, get) => ({
  // <-- Thêm 'get' vào đây
  isInitialized: false, // <-- Giá trị ban đầu
  // State ban đầu
  turn: 1,
  phase: "draw",
  playerEner: 0,
  player: { mainDeck: [], lrigDeck: [] },
  ai: { mainDeck: [], lrigDeck: [] },

  // Actions (hàm để thay đổi state)
  increaseTurn: () => set((state) => ({ turn: state.turn + 1 })),

  setPlayerEner: (amount) => set({ playerEner: amount }),

  initializeGame: () => {
    // Chỉ khởi tạo nếu chưa làm trước đó
    if (get().isInitialized) {
      // <-- Dùng get() để đọc state hiện tại
      return;
    }

    // Lọc và tạo instance cho LRIG Deck
    const playerLrigDeck = divaDebutDeckEn
      .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
      .map((c) => createCardInstance(c, "player"));

    // Lọc và tạo instance cho Main Deck
    const playerMainDeck = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .map((c) => createCardInstance(c, "player"));

    // TODO: Xáo trộn Main Deck

    set({
      isInitialized: true, // <-- Đặt cờ thành true
      player: {
        mainDeck: playerMainDeck,
        lrigDeck: playerLrigDeck,
      },
      // Tạm thời AI dùng chung bộ bài
      ai: {
        mainDeck: divaDebutDeckEn
          .filter((c) => c.backType === "MAIN")
          .map((c) => createCardInstance(c, "ai")),
        lrigDeck: divaDebutDeckEn
          .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
          .map((c) => createCardInstance(c, "ai")),
      },
    });
  },
}));

export default useGameStore;
