// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";

// --- STATE CỐT LÕI (Mở rộng) ---
interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  lrigZone: (CardInstance | null)[]; // Thêm lại
  lifeCloth: CardInstance[]; // Thêm lại
  hand: CardInstance[]; // Thêm lại
}

interface GameState {
  gameStarted: boolean;
  player: PlayerState;
  ai: PlayerState;
  setupDecks: () => void;
  dealInitialCards: () => void; // <-- ACTION MỚI
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

// --- STORE CẬP NHẬT ---
const useGameStore = create<GameState>((set, get) => ({
  // Thêm 'get' để có thể gọi action khác
  gameStarted: false,
  player: {
    mainDeck: [],
    lrigDeck: [],
    lrigZone: [null, null, null], // Khởi tạo
    lifeCloth: [], // Khởi tạo
    hand: [], // Khởi tạo
  },
  ai: {
    mainDeck: [],
    lrigDeck: [],
    lrigZone: [null, null, null],
    lifeCloth: [],
    hand: [],
  },

  // Action setupDecks giờ sẽ gọi action tiếp theo
  setupDecks: () => {
    // ... logic tạo và xáo bài như cũ ...
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
        ...get().player, // Giữ lại các zone đã khởi tạo
        mainDeck: playerMainDeck,
        lrigDeck: playerLrigDeck,
      },
    });

    // GỌI ACTION TIẾP THEO
    // Dùng setTimeout để tạo một khoảng trễ nhỏ, giúp người chơi thấy 2 chồng bài xuất hiện trước
    setTimeout(() => {
      get().dealInitialCards();
    }, 500); // 0.5 giây
  },

  // Action mới để chia bài ra bàn
  dealInitialCards: () => {
    set((state) => {
      // Tạo bản sao để không thay đổi state cũ trực tiếp
      const playerMainDeck = [...state.player.mainDeck];
      const playerLrigDeck = [...state.player.lrigDeck];

      // 1. Đặt 3 LRIG Level 0 ra sân (tạm thời hard-code)
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

      // 2. Rút 5 lá bài lên tay
      const initialHand = playerMainDeck.splice(0, 5);
      initialHand.forEach((c) => (c.isFaceUp = true));

      // 3. Đặt 7 lá Life Cloth
      const lifeClothStack = playerMainDeck.splice(0, 7);

      // 4. Trả về state đã được cập nhật
      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck, // Deck đã bị rút bớt
          lrigDeck: remainingLrigDeck, // LRIG Deck đã bị rút bớt
          hand: initialHand,
          lifeCloth: lifeClothStack,
          lrigZone: initialLrigs,
        },
      };
    });
  },
}));

export default useGameStore;
