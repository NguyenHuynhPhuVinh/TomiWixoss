// src/store/slices/setupSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
import { CardData, CardInstance } from "@/types/game";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";
import { validateDeck } from "@/logic/deckValidation";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";

// Helper function này thuộc về setup, nên chúng ta đưa nó vào đây
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

// Định nghĩa interface cho slice
export interface SetupSlice {
  prepareDecks: () => void;
  drawInitialHand: () => void;
  performMulligan: (cardsToReturnUuids: string[]) => void;
  dealRemainingSetup: (
    centerUuid: string,
    assist1Uuid: string,
    assist2Uuid: string
  ) => void;
  dealRemainingSetupAfterMulligan: () => void;
}

// Hàm tạo slice
export const createSetupSlice: StateCreator<GameStore, [], [], SetupSlice> = (
  set,
  get
) => ({
  prepareDecks: () => {
    get().addLog("Bắt đầu chuẩn bị trận đấu...", "system");
    const fullMainDeckData = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) => Array(4).fill(card))
      .slice(0, 40);
    const fullLrigDeckData = divaDebutDeckEn.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );

    const validation = validateDeck(fullMainDeckData, fullLrigDeckData);
    if (!validation.isValid) {
      const errorMessages =
        "Bộ bài không hợp lệ: " + validation.errors.join(", ");
      get().addLog(errorMessages, "system");
      alert(errorMessages);
      return;
    }

    get().addLog("Bộ bài hợp lệ. Xáo bài...", "system");
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
      phase: "selecting_lrigs",
    });
    get().addLog("Đang chờ người chơi chọn LRIG...", "system");
  },

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

  performMulligan: (cardsToReturnUuids) => {
    const amountToRedraw = cardsToReturnUuids.length;
    if (amountToRedraw > 0) {
      get().addLog(`Đổi ${amountToRedraw} lá bài.`, "action");
    } else {
      get().addLog("Không đổi bài.", "info");
    }

    set((state) => {
      if (amountToRedraw === 0) return {};
      const hand = [...state.player.hand];
      const deck = [...state.player.mainDeck];
      const cardsToKeep = hand.filter(
        (c) => !cardsToReturnUuids.includes(c.uuid)
      );
      const cardsToReturn = hand.filter((c) =>
        cardsToReturnUuids.includes(c.uuid)
      );
      cardsToReturn.forEach((card) => (card.isFaceUp = false));
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
    setTimeout(() => get().dealRemainingSetupAfterMulligan(), 500);
  },

  dealRemainingSetup: (centerUuid, assist1Uuid, assist2Uuid) => {
    set((state) => {
      const playerLrigDeck = [...state.player.lrigDeck];
      const centerLrig = playerLrigDeck.find((c) => c.uuid === centerUuid);
      const assistLrig1 = playerLrigDeck.find((c) => c.uuid === assist1Uuid);
      const assistLrig2 = playerLrigDeck.find((c) => c.uuid === assist2Uuid);
      if (!centerLrig || !assistLrig1 || !assistLrig2) return state;

      get().addLog(`Center LRIG được chọn: ${centerLrig.name}.`, "action");
      get().addLog(
        `Assist LRIG được chọn: ${assistLrig1.name} & ${assistLrig2.name}.`,
        "action"
      );

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
    setTimeout(() => get().drawInitialHand(), 500);
  },

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
    const newState = get();
    const phaseText =
      newState.phase.charAt(0).toUpperCase() + newState.phase.slice(1);
    get().addLog(
      `Bắt đầu Turn ${newState.turn} - ${phaseText} Phase`,
      "system"
    );
  },
});
