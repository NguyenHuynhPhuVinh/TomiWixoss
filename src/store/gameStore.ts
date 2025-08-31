// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array"; // Cài đặt: npm install shuffle-array

// Thêm một phase đặc biệt cho việc chuẩn bị game
type GamePhase =
  | "setup"
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
  phase: GamePhase;
  playerEner: number;
  player: PlayerState;
  ai: PlayerState;
  increaseTurn: () => void;
  setPlayerEner: (amount: number) => void;
  // XÓA initializeGame
  // THAY THẾ BẰNG CÁC ACTION MỚI
  setupDecks: () => void;
  dealInitialCards: () => void;
  mulligan: (cardsToReturnUuids: string[]) => void;
  upPhase: () => void;
  growPhase: (lrigToGrowUuid: string) => void;
  endTurn: () => void;
  drawCard: (amount: number) => void; // <-- THÊM ACTION RÚT BÀI
  returnAllCardsFromHand: () => void; // <-- THÊM ACTION TRẢ BÀI
  returnSingleCardFromHand: (cardUuid: string) => void; // <-- THÊM ACTION MỚI
  goToNextPhase: () => void;
  chargeEner: (
    cardUuid: string,
    from: "hand" | "signiZone",
    signiIndex?: number
  ) => void;
  playSigni: (cardUuid: string, zoneIndex: number) => void;
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
  phase: "setup", // Phase ban đầu là 'setup'
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

  // --- ACTIONS MỚI ---

  // 1. Chỉ tạo và xáo trộn bài
  setupDecks: () => {
    let fullMainDeck = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) =>
        Array(4)
          .fill(card)
          .map(() => createCardInstance(card, "player"))
      )
      .slice(0, 40);
    shuffle(fullMainDeck);

    let fullLrigDeck = divaDebutDeckEn
      .filter((c) => c.backType === "LRIG" || c.backType === "PIECE")
      .map((c) => createCardInstance(c, "player"));

    set({
      player: {
        ...get().player,
        mainDeck: fullMainDeck,
        lrigDeck: fullLrigDeck,
      },
      // TODO: setup cho AI tương tự
      phase: "setup", // Vẫn đang trong giai đoạn setup
    });
  },

  // 2. Chia bài ra bàn đấu
  dealInitialCards: () => {
    set((state) => {
      const playerMainDeck = [...state.player.mainDeck];
      const playerLrigDeck = [...state.player.lrigDeck];

      // a. Lấy 7 lá làm Life Cloth
      const lifeClothStack = playerMainDeck.splice(0, 7);

      // b. Rút 5 lá bài đầu tiên lên tay
      const initialHand = playerMainDeck.splice(0, 5);
      initialHand.forEach((c) => (c.isFaceUp = true));

      // c. Đặt 3 LRIG level 0 ra sân
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
          hand: initialHand,
          lifeCloth: lifeClothStack,
          lrigZone: initialLrigs,
        },
        phase: "mulligan", // Chuyển sang phase Mulligan
      };
    });
  },

  // 3. Xử lý Mulligan
  mulligan: (cardsToReturnUuids: string[]) => {
    set((state) => {
      const amountToRedraw = cardsToReturnUuids.length;
      if (amountToRedraw === 0) {
        // Nếu không mulligan, chuyển sang lượt đầu tiên
        return { phase: "up", turn: 1 };
      }

      const hand = [...state.player.hand];
      const deck = [...state.player.mainDeck];

      const cardsToKeep = hand.filter(
        (c) => !cardsToReturnUuids.includes(c.uuid)
      );
      const cardsToReturn = hand.filter((c) =>
        cardsToReturnUuids.includes(c.uuid)
      );

      // Trả bài về deck và xáo trộn
      deck.push(...cardsToReturn);
      shuffle(deck);

      // Rút lại số bài tương ứng
      const newCards = deck.splice(0, amountToRedraw);
      newCards.forEach((c) => (c.isFaceUp = true));

      return {
        player: {
          ...state.player,
          mainDeck: deck,
          hand: [...cardsToKeep, ...newCards],
        },
        phase: "up", // Bắt đầu lượt với Up Phase
        turn: 1,
      };
    });
  },

  // 4. Các action cho các phase (ví dụ `drawCard`, `chargeEner` đã có)
  // ...
  upPhase: () => {
    // Lật các lá bài downed
    set((state) => ({
      player: {
        ...state.player,
        signiZone: state.player.signiZone.map((card) =>
          card ? { ...card, isDowned: false } : null
        ),
        lrigZone: state.player.lrigZone.map((card) =>
          card ? { ...card, isDowned: false } : null
        ),
      },
      phase: "draw",
    }));
  },

  growPhase: (lrigToGrowUuid: string) => {
    // Sẽ implement sau
    set({ phase: "main" });
  },

  endTurn: () => {
    // Sẽ implement sau
    set((state) => ({ turn: state.turn + 1, phase: "up" }));
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

  goToNextPhase: () => {
    set((state) => {
      const currentPhaseIndex = TURN_PHASES.indexOf(state.phase as any);
      let nextPhaseIndex = currentPhaseIndex + 1;
      let newTurn = state.turn;

      if (nextPhaseIndex >= TURN_PHASES.length) {
        nextPhaseIndex = 0; // Quay về Up Phase
        newTurn += 1; // Bắt đầu lượt mới
        // TODO: Logic chuyển lượt cho AI sau này
      }

      const nextPhase = TURN_PHASES[nextPhaseIndex];

      // === LOGIC TỰ ĐỘNG CỦA PHASE ===
      // Sau này, bạn có thể thêm các logic tự động ở đây.
      // Ví dụ: khi vào Up Phase, tự động "up" tất cả các lá bài.

      // if (nextPhase === 'up') {
      //   // Tự động up bài
      // }

      return { phase: nextPhase, turn: newTurn };
    });
  },

  chargeEner: (cardUuid, from, signiIndex) => {
    set((state) => {
      let cardToCharge: CardInstance | undefined;
      const newPlayerState = { ...state.player };

      if (from === "hand") {
        cardToCharge = newPlayerState.hand.find((c) => c.uuid === cardUuid);
        if (cardToCharge) {
          newPlayerState.hand = newPlayerState.hand.filter(
            (c) => c.uuid !== cardUuid
          );
        }
      } else if (from === "signiZone" && signiIndex !== undefined) {
        cardToCharge = newPlayerState.signiZone[signiIndex] ?? undefined;
        if (cardToCharge) {
          newPlayerState.signiZone[signiIndex] = null;
        }
      }

      if (cardToCharge) {
        cardToCharge.isFaceUp = true;
        newPlayerState.enerZone = [...newPlayerState.enerZone, cardToCharge];
      }

      return { player: newPlayerState };
    });
  },

  playSigni: (cardUuid, zoneIndex) => {
    set((state) => {
      // Kiểm tra xem ô có trống không
      if (state.player.signiZone[zoneIndex]) return state;

      const cardToPlay = state.player.hand.find((c) => c.uuid === cardUuid);
      if (!cardToPlay) return state;

      const newPlayerState = { ...state.player };
      newPlayerState.hand = newPlayerState.hand.filter(
        (c) => c.uuid !== cardUuid
      );
      cardToPlay.isFaceUp = true;
      newPlayerState.signiZone[zoneIndex] = cardToPlay;

      return { player: newPlayerState };
    });
  },
}));

export default useGameStore;
