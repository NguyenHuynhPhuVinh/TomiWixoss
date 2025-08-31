// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";

interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  hand: CardInstance[]; // <-- THÊM HAND
  // Thêm các zone khác sau: enerZone, signiZone, trash...
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
  drawCard: (amount: number) => void; // <-- THÊM ACTION RÚT BÀI
  returnAllCardsFromHand: () => void; // <-- THÊM ACTION TRẢ BÀI
  returnSingleCardFromHand: (cardUuid: string) => void; // <-- THÊM ACTION MỚI
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
  player: { mainDeck: [], lrigDeck: [], hand: [] }, // Thêm hand rỗng
  ai: { mainDeck: [], lrigDeck: [], hand: [] },

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
        hand: [], // Thêm hand rỗng
      },
      // Tạm thời AI dùng chung bộ bài
      ai: {
        mainDeck: divaDebutDeckEn
          .filter((c) => c.backType === "MAIN")
          .map((c) => createCardInstance(c, "ai")),
        lrigDeck: divaDebutDeckEn
          .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
          .map((c) => createCardInstance(c, "ai")),
        hand: [], // Thêm hand rỗng cho AI
      },
    });
  },

  drawCard: (amount: number) => {
    set((state) => {
      const playerDeck = [...state.player.mainDeck];
      const playerHand = [...state.player.hand];

      // Rút 'amount' lá bài từ trên cùng của bộ bài
      for (let i = 0; i < amount; i++) {
        if (playerDeck.length > 0) {
          const drawnCard = playerDeck.pop()!; // Lấy lá bài trên cùng
          drawnCard.isFaceUp = true; // Lật ngửa lá bài khi lên tay
          playerHand.push(drawnCard);
        }
      }

      return {
        player: {
          ...state.player,
          mainDeck: playerDeck,
          hand: playerHand,
        },
      };
    });
  },

  returnAllCardsFromHand: () => {
    set((state) => {
      // Logic này sẽ phức tạp hơn nếu cần giữ đúng thứ tự bộ bài,
      // nhưng tạm thời chúng ta chỉ cần đưa chúng về lại bộ bài và xáo trộn.
      const handCards = state.player.hand.map((card) => ({
        ...card,
        isFaceUp: false,
      }));
      const newMainDeck = [...state.player.mainDeck, ...handCards];

      // TODO: Xáo trộn (shuffle) newMainDeck ở đây

      return {
        player: {
          ...state.player,
          mainDeck: newMainDeck,
          hand: [], // Dọn sạch tay
        },
      };
    });
  },

  returnSingleCardFromHand: (cardUuid: string) => {
    set((state) => {
      const cardToReturn = state.player.hand.find((c) => c.uuid === cardUuid);
      if (!cardToReturn) return state; // Không tìm thấy bài, không làm gì cả

      // Tạo một bản sao và reset trạng thái của nó
      const returnedCard = { ...cardToReturn, isFaceUp: false };

      // Lọc lá bài đó ra khỏi tay
      const newHand = state.player.hand.filter((c) => c.uuid !== cardUuid);

      // Thêm lá bài đó vào bộ bài
      const newMainDeck = [...state.player.mainDeck, returnedCard];

      // TODO: Xáo trộn bộ bài sau này

      return {
        player: {
          ...state.player,
          hand: newHand,
          mainDeck: newMainDeck,
        },
      };
    });
  },
}));

export default useGameStore;
