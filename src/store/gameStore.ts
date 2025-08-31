// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";

// --- STATE CỐT LÕI ---
interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  // Tạm thời bỏ hết các zone khác
}

interface GameState {
  gameStarted: boolean; // Một cờ đơn giản để biết game đã bắt đầu hay chưa
  player: PlayerState;
  ai: PlayerState;
  // --- ACTION CỐT LÕI ---
  setupDecks: () => void; // Action duy nhất của chúng ta
}

// Hàm helper để tạo instance
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

// --- STORE TỐI GIẢN ---
const useGameStore = create<GameState>((set) => ({
  gameStarted: false, // Ban đầu, game chưa bắt đầu
  player: {
    mainDeck: [],
    lrigDeck: [],
  },
  ai: {
    mainDeck: [],
    lrigDeck: [],
  },

  // Action duy nhất để chuẩn bị 2 chồng bài
  setupDecks: () => {
    // 1. Tạo và xáo trộn Main Deck
    let playerMainDeck = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) =>
        Array(4)
          .fill(card)
          .map(() => createCardInstance(card, "player"))
      )
      .slice(0, 40);
    shuffle(playerMainDeck);

    // 2. Tạo LRIG Deck
    let playerLrigDeck = divaDebutDeckEn
      .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
      .map((c) => createCardInstance(c, "player"));

    // 3. Cập nhật state
    set({
      gameStarted: true, // Đánh dấu là game đã bắt đầu
      player: {
        mainDeck: playerMainDeck,
        lrigDeck: playerLrigDeck,
      },
      // TODO: làm tương tự cho AI nếu cần
    });
  },
}));

export default useGameStore;
