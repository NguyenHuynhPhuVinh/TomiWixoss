// src/store/gameStore.ts
import { create } from "zustand";
import { CardInstance, CardData } from "@/types/game"; // Chắc chắn rằng các type khác được export từ đây
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";
import { findInitialLrigs } from "@/logic/setup"; // <-- IMPORT HÀM MỚI
import { validateDeck } from "@/logic/deckValidation"; // <-- IMPORT HÀM MỚI

// Định nghĩa kiểu cho một entry trong log
export type LogType = "info" | "action" | "system" | "cost";
export interface LogEntry {
  id: string; // Dùng uuid để làm key trong React
  message: string;
  type: LogType;
  timestamp: number; // Để sau này có thể thêm timestamp nếu muốn
}

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

// Định nghĩa một kiểu cho các hành động của người chơi
type PlayerAction = {
  type: "place_signi";
  cardUuid: string;
};

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
  actionTakenInPhase: boolean; // <-- STATE MỚI
  playerAction: PlayerAction | null; // <-- STATE MỚI
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
  // --- ACTION MỚI CHO ENER PHASE ---
  chargeEnerFromHand: (cardUuid: string) => void;
  chargeEnerFromSigni: (cardUuid: string, fromZoneIndex: number) => void; // <-- ACTION MỚI
  // --- ACTION MỚI CHO GROW PHASE ---
  growCenterLrig: (targetLrigUuid: string) => void;
  growAssistLrig: (targetLrigUuid: string, fromZoneIndex: number) => void; // <-- ACTION MỚI
  isZoneViewerOpen: boolean; // State mới để điều khiển modal
  openZoneViewer: () => void;
  closeZoneViewer: () => void;
  viewingLrigDeckForGrow: { forAssistIndex: number | null } | null; // <-- STATE MỚI
  openLrigDeckViewerForAssist: (zoneIndex: number) => void; // <-- ACTION MỚI
  closeLrigDeckViewer: () => void; // <-- ACTION MỚI
  // --- ACTIONS MỚI CHO MAIN PHASE ---
  initiatePlaceSigni: (cardUuid: string) => void;
  placeSigni: (toZoneIndex: number) => void;
  cancelPlayerAction: () => void;
  // --- LOG SYSTEM ---
  logs: LogEntry[];
  addLog: (message: string, type?: LogType) => void;
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
  actionTakenInPhase: false, // Giá trị ban đầu
  playerAction: null, // Ban đầu không có hành động nào
  isZoneViewerOpen: false, // Giá trị ban đầu
  viewingLrigDeckForGrow: null, // Giá trị ban đầu
  logs: [], // Khởi tạo mảng log rỗng

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
    get().addLog("Bắt đầu chuẩn bị trận đấu...", "system");
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
      get().addLog(errorMessages, "system"); // Log lỗi ra luôn
      alert(errorMessages);
      return; // Rất quan trọng: Dừng action tại đây
    }
    // =============================

    get().addLog("Bộ bài hợp lệ. Xáo bài...", "system");
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
    get().addLog("Đang chờ người chơi chọn LRIG...", "system");
    // Xóa setTimeout và không gọi drawInitialHand nữa
  },

  // BƯỚC 2: Rút 5 lá bài lên tay và chuyển sang phase Mulligan
  drawInitialHand: () => {
    get().addLog("Rút 5 lá bài khởi đầu.", "action");
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
    get().addLog("Bắt đầu giai đoạn Mulligan.", "system");
  },

  // BƯỚC 3: Người chơi quyết định đổi bài, sau đó tự động gọi bước 4
  performMulligan: (cardsToReturnUuids) => {
    const amountToRedraw = cardsToReturnUuids.length;
    if (amountToRedraw > 0) {
      get().addLog(`Đổi ${amountToRedraw} lá bài.`, "action");
    } else {
      get().addLog("Không đổi bài.", "info");
    }
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

      get().addLog(`Center LRIG được chọn: ${centerLrig.name}.`, "action");
      get().addLog(
        `Assist LRIG được chọn: ${assistLrig1.name} & ${assistLrig2.name}.`,
        "action"
      );

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
    get().addLog("Chia 7 lá Life Cloth.", "system");
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
    // Đây là điểm bắt đầu của lượt 1
    const newState = get();
    const phaseText =
      newState.phase.charAt(0).toUpperCase() + newState.phase.slice(1);
    get().addLog(
      `Bắt đầu Turn ${newState.turn} - ${phaseText} Phase`,
      "system"
    );
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

      return {
        phase: nextPhase,
        turn: newTurn,
        mustDiscard: mustDiscardNow,
        actionTakenInPhase: false, // <-- RESET CỜ KHI CHUYỂN PHASE
      };
    });

    // Log ra phase mới sau khi state đã được cập nhật
    const newState = get();
    const phaseText =
      newState.phase.charAt(0).toUpperCase() + newState.phase.slice(1);
    get().addLog(`Turn ${newState.turn} - ${phaseText} Phase`, "system");
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
    // Kiểm tra xem có đang ở đúng phase không (optional, nhưng là good practice)
    if (get().phase !== "draw") {
      console.warn("Attempted to draw card outside of Draw Phase.");
      return;
    }

    // Ngăn rút bài nếu đã rút rồi
    if (get().actionTakenInPhase) {
      console.warn("Draw action has already been taken this turn.");
      return;
    }

    set((state) => {
      // 1. Xác định số lá bài cần rút theo luật
      const amountToDraw = state.turn === 1 ? 1 : 2;

      // 2. Kiểm tra xem deck có đủ bài không
      if (state.player.mainDeck.length === 0) {
        console.log("Main Deck is empty, cannot draw.");
        // TODO: Xử lý logic "Refresh Deck" sau này
        return state;
      }

      // 3. Chuẩn bị các mảng mới (nguyên tắc bất biến)
      const playerMainDeck = [...state.player.mainDeck];
      const playerHand = [...state.player.hand];

      // 4. Rút bài
      const drawnCards: CardInstance[] = [];
      for (let i = 0; i < amountToDraw && playerMainDeck.length > 0; i++) {
        // Lấy lá bài trên cùng của bộ bài (phần tử cuối của mảng)
        const drawnCard = playerMainDeck.pop()!;
        // Lật ngửa lá bài khi lên tay
        drawnCard.isFaceUp = true;
        drawnCards.push(drawnCard);
      }

      console.log(`Player draws ${drawnCards.length} card(s).`);

      // 5. Cập nhật state
      return {
        player: {
          ...state.player,
          mainDeck: playerMainDeck, // Bộ bài đã bị rút bớt
          hand: [...playerHand, ...drawnCards], // Tay bài được thêm bài mới
        },
        actionTakenInPhase: true, // <-- SET CỜ SAU KHI THỰC HIỆN
      };
    });
    // Thêm log sau khi rút bài
    const amountToDraw = get().turn === 1 ? 1 : 2;
    get().addLog(`Rút ${amountToDraw} lá bài.`, "action");
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

  // --- ACTION MỚI ---
  chargeEnerFromHand: (cardUuid: string) => {
    // Các bước kiểm tra điều kiện giữ nguyên
    if (get().actionTakenInPhase) {
      console.warn("Ener Charge action has already been taken this turn.");
      return;
    }
    if (get().phase !== "ener") {
      console.warn("Attempted to charge ener outside of Ener Phase.");
      return;
    }

    // Tìm lá bài TRƯỚC khi set state để có thể log tên của nó
    const cardToCharge = get().player.hand.find((c) => c.uuid === cardUuid);
    if (!cardToCharge) {
      console.error("Card not found in hand to charge ener.");
      return;
    }

    // === THÊM DÒNG LOG CÒN THIẾU Ở ĐÂY ===
    get().addLog(`Nạp Ener từ tay: ${cardToCharge.name}.`, "action");
    // =====================================

    set((state) => {
      // Logic di chuyển bài không cần thay đổi
      const newHand = state.player.hand.filter((c) => c.uuid !== cardUuid);
      cardToCharge.isFaceUp = true;
      const newEnerZone = [...state.player.enerZone, cardToCharge];

      return {
        player: {
          ...state.player,
          hand: newHand,
          enerZone: newEnerZone,
        },
        actionTakenInPhase: true,
      };
    });
  },

  // --- SỬA LỖI TRONG chargeEnerFromSigni ---
  chargeEnerFromSigni: (cardUuid: string, fromZoneIndex: number) => {
    // Các bước kiểm tra điều kiện giữ nguyên
    if (get().actionTakenInPhase) {
      console.warn("Ener Charge action has already been taken this turn.");
      return;
    }
    if (get().phase !== "ener") {
      console.warn("Attempted to charge ener outside of Ener Phase.");
      return;
    }

    // Tìm lá bài TRƯỚC khi set state
    const cardToCharge = get().player.signiZone[fromZoneIndex];
    if (!cardToCharge || cardToCharge.uuid !== cardUuid) {
      console.error("Card not found in SIGNI zone to charge ener.");
      return;
    }

    // === THÊM DÒNG LOG CÒN THIẾU Ở ĐÂY ===
    get().addLog(`Nạp Ener từ sân: ${cardToCharge.name}.`, "action");
    // =====================================

    set((state) => {
      // Logic di chuyển bài không cần thay đổi
      const newSigniZone = [...state.player.signiZone];
      newSigniZone[fromZoneIndex] = null;
      cardToCharge.isFaceUp = true;
      const newEnerZone = [...state.player.enerZone, cardToCharge];

      return {
        player: {
          ...state.player,
          signiZone: newSigniZone,
          enerZone: newEnerZone,
        },
        actionTakenInPhase: true,
      };
    });
  },

  // --- ACTION MỚI CHO GROW PHASE ---
  growCenterLrig: (targetLrigUuid: string) => {
    // --- 1. CÁC BƯỚC KIỂM TRA ĐIỀU KIỆN ---
    if (get().phase !== "grow") return;
    if (get().actionTakenInPhase) {
      console.warn("Grow action already taken this turn.");
      return;
    }

    const state = get();
    const targetLrig = state.player.lrigDeck.find(
      (c) => c.uuid === targetLrigUuid
    );
    const currentCenterLrig = state.player.lrigZone[1];

    if (!targetLrig || !currentCenterLrig) {
      console.error("Target LRIG or current Center LRIG not found.");
      return;
    }

    // Kiểm tra Level và LRIG Type
    if (
      targetLrig.level !== (currentCenterLrig.level ?? -1) + 1 ||
      targetLrig.lrigType !== currentCenterLrig.lrigType
    ) {
      console.error("Invalid Grow target: Level or LRIG Type mismatch.");
      return;
    }

    // --- 2. XỬ LÝ THANH TOÁN CHI PHÍ (COST) ---
    const growCost = targetLrig.growCost;
    if (!growCost) {
      console.error("Target LRIG has no Grow Cost defined.");
      return;
    }

    // Tạm thời, chúng ta sẽ có một logic thanh toán đơn giản.
    // Logic này sẽ được cải tiến sau này để người chơi có thể chọn Ener.
    const tempEnerZone = [...state.player.enerZone];
    const paidEner: CardInstance[] = [];
    let canPay = true;

    for (const color in growCost) {
      for (let i = 0; i < growCost[color]; i++) {
        let enerIndex = -1;
        if (color === "Colorless") {
          enerIndex = tempEnerZone.findIndex((e) => e); // Lấy bất kỳ lá nào
        } else {
          // Ưu tiên lá có màu chính xác trước
          enerIndex = tempEnerZone.findIndex((e) =>
            e.colors.includes(color as any)
          );
          // Nếu không có, tìm lá Multi Ener
          if (enerIndex === -1) {
            enerIndex = tempEnerZone.findIndex((e) =>
              e.abilities?.some((a) => a.description.includes("[Multi Ener]"))
            );
          }
        }

        if (enerIndex !== -1) {
          paidEner.push(tempEnerZone.splice(enerIndex, 1)[0]);
        } else {
          canPay = false;
          break;
        }
      }
      if (!canPay) break;
    }

    if (!canPay) {
      console.error("Cannot pay Grow Cost.", growCost);
      alert("Không đủ Ener để thực hiện Grow!");
      get().addLog(`Không thể Grow: Không đủ Ener.`, "info");
      return;
    }

    // Thêm log trước khi grow
    get().addLog(`Trả ${paidEner.length} Ener.`, "cost");
    get().addLog(`Grow Center LRIG thành ${targetLrig.name}!`, "action");

    // --- 3. CẬP NHẬT STATE SAU KHI MỌI THỨ HỢP LỆ ---
    set((currentState) => {
      // Di chuyển Ener đã trả vào mộ
      const newTrash = [...currentState.player.trash, ...paidEner];

      // Tạo LRIG mới với các lá bài cũ nằm dưới
      const newCenterLrig: CardInstance = {
        ...targetLrig,
        isFaceUp: true,
        underneathCards: [
          currentCenterLrig,
          ...(currentCenterLrig.underneathCards || []),
        ],
      };

      // Cập nhật LRIG Zone
      const newLrigZone = [...currentState.player.lrigZone];
      newLrigZone[1] = newCenterLrig;

      // Xóa LRIG đã dùng khỏi LRIG Deck
      const newLrigDeck = currentState.player.lrigDeck.filter(
        (c) => c.uuid !== targetLrigUuid
      );

      return {
        player: {
          ...currentState.player,
          enerZone: tempEnerZone, // Ener Zone đã bị trừ
          trash: newTrash,
          lrigDeck: newLrigDeck,
          lrigZone: newLrigZone,
        },
        actionTakenInPhase: true,
        isZoneViewerOpen: false, // Tự động đóng modal sau khi Grow thành công
      };
    });
  },

  openZoneViewer: () => set({ isZoneViewerOpen: true }),
  closeZoneViewer: () => set({ isZoneViewerOpen: false }),

  // --- ACTION MỚI CHO ASSIST LRIG ---
  openLrigDeckViewerForAssist: (zoneIndex: number) => {
    set({
      isZoneViewerOpen: true,
      viewingLrigDeckForGrow: { forAssistIndex: zoneIndex },
    });
  },
  closeLrigDeckViewer: () => {
    set({ isZoneViewerOpen: false, viewingLrigDeckForGrow: null });
  },

  growAssistLrig: (targetLrigUuid: string, fromZoneIndex: number) => {
    const state = get();
    const targetLrig = state.player.lrigDeck.find(
      (c) => c.uuid === targetLrigUuid
    );
    const currentAssistLrig = state.player.lrigZone[fromZoneIndex];
    const currentCenterLrig = state.player.lrigZone[1]; // Cần để kiểm tra giới hạn level

    // --- 1. KIỂM TRA ĐIỀU KIỆN ---
    if (!targetLrig || !currentAssistLrig || !currentCenterLrig) return;

    const requiredTimings = targetLrig.abilities?.find(
      (a) => a.type === "Enter"
    )?.timing;
    if (requiredTimings && !requiredTimings.includes(state.phase as any)) {
      console.error("Cannot grow Assist LRIG outside of its specified timing.");
      return;
    }

    // Kiểm tra các điều kiện Grow cơ bản
    if (
      targetLrig.level !== (currentAssistLrig.level ?? -1) + 1 ||
      targetLrig.lrigType !== currentAssistLrig.lrigType ||
      targetLrig.level > (currentCenterLrig.level ?? 0)
    ) {
      console.error("Invalid Assist LRIG Grow target.");
      return;
    }

    // --- 2. XỬ LÝ THANH TOÁN COST (Tái sử dụng logic cũ) ---
    // (Phần này giống hệt `growCenterLrig`, bạn có thể tách ra thành hàm helper sau này)
    const growCost = targetLrig.growCost;
    if (!growCost) return;
    const { canPay, tempEnerZone, paidEner } = (() => {
      const tempEnerZone = [...state.player.enerZone];
      const paidEner: CardInstance[] = [];
      let canPay = true;

      for (const color in growCost) {
        for (let i = 0; i < growCost[color]; i++) {
          let enerIndex = -1;
          if (color === "Colorless") {
            enerIndex = tempEnerZone.findIndex((e) => e); // Lấy bất kỳ lá nào
          } else {
            // Ưu tiên lá có màu chính xác trước
            enerIndex = tempEnerZone.findIndex((e) =>
              e.colors.includes(color as any)
            );
            // Nếu không có, tìm lá Multi Ener
            if (enerIndex === -1) {
              enerIndex = tempEnerZone.findIndex((e) =>
                e.abilities?.some((a) => a.description.includes("[Multi Ener]"))
              );
            }
          }

          if (enerIndex !== -1) {
            paidEner.push(tempEnerZone.splice(enerIndex, 1)[0]);
          } else {
            canPay = false;
            break;
          }
        }
        if (!canPay) break;
      }

      return { canPay, tempEnerZone, paidEner };
    })();

    if (!canPay) {
      console.error("Cannot pay Grow Cost.", growCost);
      alert("Không đủ Ener để thực hiện Grow!");
      get().addLog(`Không thể Grow Assist: Không đủ Ener.`, "info");
      return;
    }

    // Log hành động thành công
    if (paidEner.length > 0) {
      get().addLog(`Trả ${paidEner.length} Ener.`, "cost");
    }
    const side = fromZoneIndex === 0 ? "trái" : "phải";
    get().addLog(
      `Grow Assist LRIG ${side} thành ${targetLrig.name}!`,
      "action"
    );

    // --- 3. CẬP NHẬT STATE ---
    set((currentState) => {
      const newTrash = [...currentState.player.trash, ...paidEner];
      const newAssistLrig: CardInstance = {
        ...targetLrig,
        isFaceUp: true,
        underneathCards: [
          currentAssistLrig,
          ...(currentAssistLrig.underneathCards || []),
        ],
      };
      const newLrigZone = [...currentState.player.lrigZone];
      newLrigZone[fromZoneIndex] = newAssistLrig;
      const newLrigDeck = currentState.player.lrigDeck.filter(
        (c) => c.uuid !== targetLrigUuid
      );

      return {
        player: {
          ...currentState.player,
          enerZone: tempEnerZone,
          trash: newTrash,
          lrigDeck: newLrigDeck,
          lrigZone: newLrigZone,
        },
        // KHÔNG set actionTakenInPhase, vì có thể Grow nhiều lần
        isZoneViewerOpen: false,
        viewingLrigDeckForGrow: null,
      };
    });
  },

  // --- ACTIONS MỚI ---
  initiatePlaceSigni: (cardUuid) => {
    // Kích hoạt chế độ đặt bài
    set({ playerAction: { type: "place_signi", cardUuid } });
  },

  cancelPlayerAction: () => {
    // Hủy bỏ hành động hiện tại
    set({ playerAction: null });
  },

  placeSigni: (toZoneIndex) => {
    const state = get();
    if (state.playerAction?.type !== "place_signi") return;

    const cardUuid = state.playerAction.cardUuid;
    const cardToPlay = state.player.hand.find((c) => c.uuid === cardUuid);

    // Kiểm tra lại lần cuối cho chắc
    if (!cardToPlay || state.player.signiZone[toZoneIndex] !== null) {
      console.error("Invalid placement action.");
      set({ playerAction: null }); // Hủy hành động nếu không hợp lệ
      return;
    }

    set((currentState) => {
      const newHand = currentState.player.hand.filter(
        (c) => c.uuid !== cardUuid
      );
      const newSigniZone = [...currentState.player.signiZone];

      cardToPlay.isFaceUp = true; // Bài ra sân luôn ngửa
      newSigniZone[toZoneIndex] = cardToPlay;

      return {
        player: {
          ...currentState.player,
          hand: newHand,
          signiZone: newSigniZone,
        },
        playerAction: null, // Hoàn thành và thoát chế độ hành động
      };
    });
    // Thêm log sau khi đặt SIGNI
    if (cardToPlay) {
      get().addLog(
        `Đặt SIGNI: ${cardToPlay.name} vào vị trí ${toZoneIndex + 1}.`,
        "action"
      );
    }
  },

  // --- LOG SYSTEM ---
  addLog: (message, type = "info") => {
    const newLog: LogEntry = {
      id: uuidv4(),
      message,
      type,
      timestamp: Date.now(),
    };
    // Thêm log mới vào đầu mảng để hiển thị từ trên xuống
    set((state) => ({ logs: [newLog, ...state.logs] }));
  },
}));

export default useGameStore;
