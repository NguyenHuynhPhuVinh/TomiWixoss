// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game"; // Chắc chắn rằng các type khác được export từ đây
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";

// Thêm phase 'mulligan'
type GamePhase = "pre_game" | "mulligan" | "in_play";

interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  lrigZone: (CardInstance | null)[];
  lifeCloth: CardInstance[];
  hand: CardInstance[];
}

interface GameState {
  gameStarted: boolean;
  phase: GamePhase;
  player: PlayerState;
  ai: PlayerState;
  mulliganSelection: string[]; // Thêm để lưu các lá bài được chọn cho mulligan
  // --- ACTIONS ĐÃ ĐƯỢC CẤU TRÚC LẠI ---
  prepareDecks: () => void; // Bước 1: Chỉ xáo bài
  drawInitialHand: () => void; // Bước 2: Chỉ rút 5 lá đầu
  performMulligan: (cardsToReturnUuids: string[]) => void; // Bước 3: Thực hiện đổi bài
  dealRemainingSetup: () => void; // Bước 4: Chia Life Cloth và LRIGs
  setMulliganSelection: (selection: string[]) => void; // Thêm action để set mulligan selection
}

// Hàm helper giữ nguyên
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
  gameStarted: false,
  phase: "pre_game",
  mulliganSelection: [],
  player: {
    mainDeck: [],
    lrigDeck: [],
    lrigZone: [null, null, null],
    lifeCloth: [],
    hand: [],
  },
  ai: {
    mainDeck: [],
    lrigDeck: [],
    lrigZone: [null, null, null],
    lifeCloth: [],
    hand: [],
  },

  // BƯỚC 1: Chuẩn bị 2 bộ bài, sau đó tự động gọi bước 2
  prepareDecks: () => {
    let playerMainDeck = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) =>
        Array(4)
          .fill(card)
          .map(() => createCardInstance(card, "player"))
      )
      .slice(0, 40);
    shuffle(playerMainDeck);
    let playerLrigDeck = divaDebutDeckEn
      .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
      .map((c) => createCardInstance(c, "player"));
    set({
      gameStarted: true,
      player: {
        ...get().player,
        mainDeck: playerMainDeck,
        lrigDeck: playerLrigDeck,
      },
    });
    // Tự động gọi bước tiếp theo
    setTimeout(() => get().drawInitialHand(), 500);
  },

  // BƯỚC 2: Rút 5 lá bài lên tay và chuyển sang phase Mulligan
  drawInitialHand: () => {
    set((state) => {
      const playerMainDeck = [...state.player.mainDeck];
      const initialHand = playerMainDeck.splice(0, 5);
      initialHand.forEach((c) => (c.isFaceUp = true));
      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck,
          hand: initialHand,
        },
        phase: "mulligan",
      };
    });
  },

  // BƯỚC 3: Người chơi quyết định đổi bài, sau đó tự động gọi bước 4
  performMulligan: (cardsToReturnUuids) => {
    set((state) => {
      const amountToRedraw = cardsToReturnUuids.length;
      if (amountToRedraw === 0) {
        // Nếu không đổi bài, không cần làm gì với tay và bộ bài
        return {}; // Trả về object rỗng để không thay đổi state
      }
      const hand = [...state.player.hand];
      const deck = [...state.player.mainDeck];
      const cardsToKeep = hand.filter(
        (c) => !cardsToReturnUuids.includes(c.uuid)
      );
      const cardsToReturn = hand.filter((c) =>
        cardsToReturnUuids.includes(c.uuid)
      );
      // === THAY ĐỔI QUAN TRỌNG Ở ĐÂY ===
      // Trước khi trả bài về deck, hãy lật úp chúng lại
      cardsToReturn.forEach((card) => (card.isFaceUp = false));
      // ===================================
      deck.push(...cardsToReturn);
      shuffle(deck);
      const newCards = deck.splice(0, amountToRedraw);
      newCards.forEach((c) => (c.isFaceUp = true));
      return {
        player: {
          ...state.player,
          mainDeck: deck,
          hand: [...cardsToKeep, ...newCards],
        },
      };
    });
    // Tự động gọi bước cuối cùng của setup
    setTimeout(() => get().dealRemainingSetup(), 500);
  },

  // BƯỚC 4: Chia Life Cloth, đặt LRIG và chuyển game sang trạng thái "in_play"
  dealRemainingSetup: () => {
    set((state) => {
      const playerMainDeck = [...state.player.mainDeck];
      const playerLrigDeck = [...state.player.lrigDeck];

      const lifeClothStack = playerMainDeck.splice(0, 7);

      const initialLrigs: (CardInstance | null)[] = [null, null, null];
      const assist1 = playerLrigDeck.find((c) => c.id === "WXDi-D01-005");
      const center = playerLrigDeck.find((c) => c.id === "WXDi-D01-001");
      const assist2 = playerLrigDeck.find((c) => c.id === "WXDi-D01-008");
      if (assist1) assist1.isFaceUp = true;
      if (center) center.isFaceUp = true;
      if (assist2) assist2.isFaceUp = true;
      initialLrigs[0] = assist1 || null;
      initialLrigs[1] = center || null;
      initialLrigs[2] = assist2 || null;

      const remainingLrigDeck = playerLrigDeck.filter(
        (c) =>
          c.uuid !== assist1?.uuid &&
          c.uuid !== center?.uuid &&
          c.uuid !== assist2?.uuid
      );

      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck,
          lrigDeck: remainingLrigDeck,
          lifeCloth: lifeClothStack,
          lrigZone: initialLrigs,
        },
        phase: "in_play", // <-- Setup hoàn tất!
      };
    });
  },

  setMulliganSelection: (selection: string[]) => {
    set({ mulliganSelection: selection });
  },
}));

export default useGameStore;
