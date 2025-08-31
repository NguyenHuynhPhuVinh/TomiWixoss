// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array"; // Cài đặt: npm install shuffle-array

interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  hand: CardInstance[];
  // --- CÁC ZONE MỚI ---
  signiZone: (CardInstance | null)[]; // 3 vị trí
  lrigZone: (CardInstance | null)[]; // 3 vị trí
  lifeCloth: CardInstance[];
  enerZone: CardInstance[];
  trash: CardInstance[];
  lrigTrash: CardInstance[];
  checkZone: (CardInstance | null)[]; // 1 vị trí cho check zone
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
  player: {
    mainDeck: [],
    lrigDeck: [],
    hand: [],
    // Khởi tạo các zone mới
    signiZone: [null, null, null],
    lrigZone: [null, null, null],
    lifeCloth: [],
    enerZone: [],
    trash: [],
    lrigTrash: [],
    checkZone: [null],
  },
  ai: {
    mainDeck: [],
    lrigDeck: [],
    hand: [],
    signiZone: [null, null, null],
    lrigZone: [null, null, null],
    lifeCloth: [],
    enerZone: [],
    trash: [],
    lrigTrash: [],
    checkZone: [null],
  },

  // Actions (hàm để thay đổi state)
  increaseTurn: () => set((state) => ({ turn: state.turn + 1 })),

  setPlayerEner: (amount) => set({ playerEner: amount }),

  initializeGame: () => {
    if (get().isInitialized) return;

    // --- MAIN DECK SETUP ---
    // Tạo bộ bài đầy đủ (ví dụ: 4 bản sao mỗi lá) và xáo trộn
    let fullMainDeck = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) =>
        Array(4)
          .fill(card)
          .map(() => createCardInstance(card, "player"))
      )
      .slice(0, 40); // Đảm bảo đúng 40 lá
    shuffle(fullMainDeck);

    // --- LIFE CLOTH SETUP ---
    // Lấy 7 lá trên cùng làm Life Cloth
    const lifeClothStack = fullMainDeck.splice(0, 7);

    // --- LRIG DECK & INITIAL LRIGS SETUP ---
    let fullLrigDeck = divaDebutDeckEn
      .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
      .map((c) => createCardInstance(c, "player"));

    // Tìm 3 LRIG level 0 để đặt lên sân
    const initialLrigs: (CardInstance | null)[] = [null, null, null];
    // Giả sử Assist LRIG 1 là Tawil, Center là At, Assist 2 là Umr
    const assist1 = fullLrigDeck.find((c) => c.id === "WXDi-D01-005"); // Tawil
    const center = fullLrigDeck.find((c) => c.id === "WXDi-D01-001"); // At
    const assist2 = fullLrigDeck.find((c) => c.id === "WXDi-D01-008"); // Umr

    if (assist1) assist1.isFaceUp = true;
    if (center) center.isFaceUp = true;
    if (assist2) assist2.isFaceUp = true;

    initialLrigs[0] = assist1 || null;
    initialLrigs[1] = center || null;
    initialLrigs[2] = assist2 || null;

    // Loại bỏ các LRIG đã đặt ra khỏi LRIG Deck
    const remainingLrigDeck = fullLrigDeck.filter(
      (c) =>
        c.uuid !== assist1?.uuid &&
        c.uuid !== center?.uuid &&
        c.uuid !== assist2?.uuid
    );

    // === CẬP NHẬT DỮ LIỆU GIẢ LẬP ===
    const mockSigniZone: (CardInstance | null)[] = [null, null, null];
    const mockEnerZone: CardInstance[] = [];
    const mockTrash: CardInstance[] = [];
    const mockLrigTrash: CardInstance[] = []; // <-- Thêm Lrig Trash
    const mockCheckZone: (CardInstance | null)[] = [null]; // Check zone thường chỉ có 1 lá

    // Lấp đầy 3 ô SIGNI
    if (fullMainDeck.length >= 3) {
      for (let i = 0; i < 3; i++) {
        const signiCard = fullMainDeck.pop()!;
        signiCard.isFaceUp = true;
        mockSigniZone[i] = signiCard; // Đặt vào ô 0, 1, 2
      }
    }

    // Lấy 5 lá bài làm Ener (giữ nguyên)
    if (fullMainDeck.length >= 5) {
      for (let i = 0; i < 5; i++) {
        const enerCard = fullMainDeck.pop()!;
        enerCard.isFaceUp = true;
        mockEnerZone.push(enerCard);
      }
    }

    // Lấy 1 lá bài làm mộ Main Deck
    if (fullMainDeck.length > 0) {
      const trashCard = fullMainDeck.pop()!;
      trashCard.isFaceUp = true;
      mockTrash.push(trashCard);
    }

    // Lấy 1 lá LRIG làm Lrig Trash (giữ nguyên)
    if (remainingLrigDeck.length > 0) {
      const lrigTrashCard = remainingLrigDeck.pop()!;
      lrigTrashCard.isFaceUp = true;
      mockLrigTrash.push(lrigTrashCard);
    }

    // Lấy 1 lá làm Check Zone (giữ nguyên)
    if (fullMainDeck.length > 0) {
      const checkZoneCard = fullMainDeck.pop()!;
      checkZoneCard.isFaceUp = true;
      mockCheckZone[0] = checkZoneCard;
    }
    // === KẾT THÚC DỮ LIỆU GIẢ LẬP ===

    set({
      isInitialized: true,
      player: {
        mainDeck: fullMainDeck,
        lrigDeck: remainingLrigDeck,
        hand: [],
        signiZone: mockSigniZone, // <-- Dùng dữ liệu giả
        lrigZone: initialLrigs,
        lifeCloth: lifeClothStack,
        enerZone: mockEnerZone, // <-- Dùng dữ liệu giả
        trash: mockTrash, // <-- Dùng dữ liệu giả
        lrigTrash: mockLrigTrash,
        checkZone: mockCheckZone,
      },
      ai: {
        mainDeck: fullMainDeck.map((c) => createCardInstance(c, "ai")), // Tương tự nhưng cho AI
        lrigDeck: remainingLrigDeck.map((c) => createCardInstance(c, "ai")),
        hand: [],
        signiZone: [null, null, null],
        lrigZone: initialLrigs.map((l) =>
          l ? createCardInstance(l, "ai") : null
        ),
        lifeCloth: lifeClothStack.map((c) => createCardInstance(c, "ai")),
        enerZone: [],
        trash: [],
        lrigTrash: [],
        checkZone: [null],
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
