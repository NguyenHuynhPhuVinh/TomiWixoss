// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game"; // Chắc chắn rằng các type khác được export từ đây
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";
import { findInitialLrigs } from "@/logic/setup"; // <-- IMPORT HÀM MỚI
import { validateDeck } from "@/logic/deckValidation"; // <-- IMPORT HÀM MỚI

// Thêm phase 'mulligan'
type GamePhase =
  | "pre_game"
  | "selecting_lrigs"
  | "mulligan"
  | "up"
  | "draw"
  | "ener"
  | "grow"
  | "main"
  | "attack"
  | "end";
const TURN_PHASES: GamePhase[] = [
  "up",
  "draw",
  "ener",
  "grow",
  "main",
  "attack",
  "end",
];

interface PlayerState {
  mainDeck: CardInstance[];
  lrigDeck: CardInstance[];
  lrigZone: (CardInstance | null)[];
  lifeCloth: CardInstance[];
  hand: CardInstance[];
  signiZone: (CardInstance | null)[];
  enerZone: CardInstance[];
  trash: CardInstance[];
  lrigTrash: CardInstance[];
  checkZone: (CardInstance | null)[];
}

interface GameState {
  gameStarted: boolean;
  phase: GamePhase;
  turn: number;
  player: PlayerState;
  ai: PlayerState;
  mulliganSelection: string[]; // Thêm để lưu các lá bài được chọn cho mulligan
  mustDiscard: boolean; // <-- STATE MỚI
  // --- ACTIONS ĐÃ ĐƯỢC CẤU TRÚC LẠI ---
  prepareDecks: () => void; // Bước 1: Chỉ xáo bài
  drawInitialHand: () => void; // Bước 2: Chỉ rút 5 lá đầu
  performMulligan: (cardsToReturnUuids: string[]) => void; // Bước 3: Thực hiện đổi bài
  dealRemainingSetup: (
    centerUuid: string,
    assist1Uuid: string,
    assist2Uuid: string
  ) => void; // Bước 4: Chia Life Cloth và LRIGs
  dealRemainingSetupAfterMulligan: () => void; // Thêm action mới
  setMulliganSelection: (selection: string[]) => void; // Thêm action để set mulligan selection
  // --- ACTIONS MỚI CHO LƯỢT CHƠI ---
  goToNextPhase: () => void;
  upAllCards: () => void;
  drawCardForTurn: () => void;
  discardCardFromHand: (cardUuid: string) => void;
  checkEndPhaseConditions: () => void; // Kiểm tra và set cờ mustDiscard
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
  turn: 0,
  mulliganSelection: [],
  mustDiscard: false, // Ban đầu là false
  player: {
    mainDeck: [],
    lrigDeck: [],
    lrigZone: [null, null, null],
    lifeCloth: [],
    hand: [],
    signiZone: [null, null, null],
    enerZone: [],
    trash: [],
    lrigTrash: [],
    checkZone: [null],
  },
  ai: {
    mainDeck: [],
    lrigDeck: [],
    lrigZone: [null, null, null],
    lifeCloth: [],
    hand: [],
    signiZone: [null, null, null],
    enerZone: [],
    trash: [],
    lrigTrash: [],
    checkZone: [null],
  },

  // BƯỚC 1: Xác thực, sau đó chuẩn bị 2 bộ bài, rồi tự động gọi bước 2
  prepareDecks: () => {
    // === BƯỚC XÁC THỰC MỚI ===
    // Tạo bộ bài đầy đủ từ dữ liệu gốc để xác thực
    const fullMainDeckData = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) => Array(4).fill(card))
      .slice(0, 40);

    const fullLrigDeckData = divaDebutDeckEn.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );

    // Chạy hàm xác thực
    const validation = validateDeck(fullMainDeckData, fullLrigDeckData);

    if (!validation.isValid) {
      // Nếu bộ bài không hợp lệ, hiển thị lỗi và dừng lại
      const errorMessages =
        "Bộ bài không hợp lệ:\n- " + validation.errors.join("\n- ");
      console.error(errorMessages);
      alert(errorMessages);
      return; // Rất quan trọng: Dừng action tại đây
    }
    // =============================

    // Nếu bộ bài hợp lệ, tiếp tục logic tạo instance và xáo bài như cũ
    const playerMainDeck = fullMainDeckData.map((data) =>
      createCardInstance(data, "player")
    );
    shuffle(playerMainDeck);

    const playerLrigDeck = fullLrigDeckData.map((data) =>
      createCardInstance(data, "player")
    );

    set({
      gameStarted: true,
      player: {
        ...get().player,
        mainDeck: playerMainDeck,
        lrigDeck: playerLrigDeck,
      },
      phase: "selecting_lrigs", // <-- QUAN TRỌNG: Dừng lại ở đây
    });
    // Xóa setTimeout và không gọi drawInitialHand nữa
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
    setTimeout(() => get().dealRemainingSetupAfterMulligan(), 500);
  },

  // BƯỚC 4 MỚI: Người chơi xác nhận LRIG, sau đó tự động rút tay bài
  dealRemainingSetup: (
    centerUuid: string,
    assist1Uuid: string,
    assist2Uuid: string
  ) => {
    set((state) => {
      const playerLrigDeck = [...state.player.lrigDeck];

      const centerLrig = playerLrigDeck.find((c) => c.uuid === centerUuid);
      const assistLrig1 = playerLrigDeck.find((c) => c.uuid === assist1Uuid);
      const assistLrig2 = playerLrigDeck.find((c) => c.uuid === assist2Uuid);

      if (!centerLrig || !assistLrig1 || !assistLrig2) {
        console.error("LRIG selection is invalid.");
        return state;
      }

      // "OPEN!": Lật ngửa 3 LRIG
      centerLrig.isFaceUp = true;
      assistLrig1.isFaceUp = true;
      assistLrig2.isFaceUp = true;

      const initialLrigs = [assistLrig1, centerLrig, assistLrig2];
      const initialUuids = [centerUuid, assist1Uuid, assist2Uuid];
      const remainingLrigDeck = playerLrigDeck.filter(
        (c) => !initialUuids.includes(c.uuid)
      );

      return {
        player: {
          ...state.player,
          lrigDeck: remainingLrigDeck,
          lrigZone: initialLrigs,
        },
      };
    });
    // Sau khi đặt LRIG, tự động rút bài
    setTimeout(() => get().drawInitialHand(), 500);
  },

  // Tách logic chia Life Cloth ra để gọi sau Mulligan
  dealRemainingSetupAfterMulligan: () => {
    set((state) => {
      const playerMainDeck = [...state.player.mainDeck];
      const lifeClothStack = playerMainDeck.splice(0, 7);
      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck,
          lifeCloth: lifeClothStack,
        },
        phase: "up",
        turn: 1,
      };
    });
  },

  setMulliganSelection: (selection: string[]) => {
    set({ mulliganSelection: selection });
  },

  // --- ACTIONS MỚI ---
  goToNextPhase: () => {
    set((state) => {
      if (state.phase === "pre_game" || state.phase === "mulligan")
        return state; // Không làm gì trong giai đoạn setup

      const currentPhaseIndex = TURN_PHASES.indexOf(state.phase);
      let nextPhaseIndex = currentPhaseIndex + 1;
      let newTurn = state.turn;

      if (nextPhaseIndex >= TURN_PHASES.length) {
        nextPhaseIndex = 0; // Quay về Up Phase
        newTurn += 1;
      }
      const nextPhase = TURN_PHASES[nextPhaseIndex];
      let mustDiscardNow = false;

      // === LOGIC MỚI CHO END PHASE ===
      if (nextPhase === "end" && state.player.hand.length > 6) {
        mustDiscardNow = true;
      }
      // =============================

      return { phase: nextPhase, turn: newTurn, mustDiscard: mustDiscardNow };
    });
  },

  upAllCards: () => {
    set((state) => {
      const upCard = (card: CardInstance | null) =>
        card ? { ...card, isDowned: false } : null;
      return {
        player: {
          ...state.player,
          signiZone: state.player.signiZone.map(upCard),
          lrigZone: state.player.lrigZone.map(upCard),
        },
      };
    });
  },

  drawCardForTurn: () => {
    set((state) => {
      const amountToDraw = state.turn === 1 ? 1 : 2;
      const playerMainDeck = [...state.player.mainDeck];
      const drawnCards = playerMainDeck.splice(0, amountToDraw);
      drawnCards.forEach((c) => (c.isFaceUp = true));
      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck,
          hand: [...state.player.hand, ...drawnCards],
        },
      };
    });
  },

  // --- ACTION MỚI ---
  checkEndPhaseConditions: () => {
    // Action này được gọi sau mỗi lần discard, để kiểm tra xem đã đủ chưa
    const handSize = get().player.hand.length;
    if (handSize <= 6) {
      set({ mustDiscard: false });
    }
  },

  discardCardFromHand: (cardUuid: string) => {
    set((state) => {
      const cardToDiscard = state.player.hand.find((c) => c.uuid === cardUuid);
      if (!cardToDiscard) return state;

      const newHand = state.player.hand.filter((c) => c.uuid !== cardUuid);
      // Lá bài bỏ đi sẽ vào Trash và lật ngửa
      cardToDiscard.isFaceUp = true;
      const newTrash = [...state.player.trash, cardToDiscard];

      return {
        player: {
          ...state.player,
          hand: newHand,
          trash: newTrash,
        },
      };
    });
    // Sau khi bỏ bài, gọi hàm kiểm tra lại
    get().checkEndPhaseConditions();
  },
}));

export default useGameStore;
