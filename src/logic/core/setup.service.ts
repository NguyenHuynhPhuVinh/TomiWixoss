// src/logic/core/setup.service.ts
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { validateDeck } from "../deckValidation";
import { CardData, CardInstance } from "@/types/game";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";
import useGameStore from "@/store/gameStore";
import { PlayerState, GameState } from "@/store/types"; // Import GameState
import { Game } from "../models/game.model"; // Import Game model

// Helper này chỉ dùng nội bộ trong service này
const createCardInstance = (
  data: CardData,
  owner: "player" | "ai"
): CardInstance => ({
  ...data,
  uuid: uuidv4(),
  isFaceUp: false,
  isDowned: false,
  owner,
});

class SetupService {
  public startSetup() {
    const { addLog, initializeGame } = useGameStore.getState();
    addLog("Bắt đầu chuẩn bị trận đấu...", "system");

    // 1. Validate Deck
    const fullMainDeckData = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) => Array(4).fill(card))
      .slice(0, 40);
    const fullLrigDeckData = divaDebutDeckEn.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );

    const validation = validateDeck(fullMainDeckData, fullLrigDeckData);
    if (!validation.isValid) {
      addLog("Bộ bài không hợp lệ: " + validation.errors.join(", "), "system");
      alert("Bộ bài không hợp lệ:\n- " + validation.errors.join("\n- "));
      return;
    }
    addLog("Bộ bài hợp lệ. Xáo bài...", "system");

    // 2. Tạo Card Instances và xáo bài
    const mainDeck = fullMainDeckData.map((d) =>
      createCardInstance(d, "player")
    );
    shuffle(mainDeck);
    const lrigDeck = fullLrigDeckData.map((d) =>
      createCardInstance(d, "player")
    );

    // 3. Chuẩn bị state ban đầu cho Player
    const initialPlayerState: PlayerState = {
      mainDeck,
      lrigDeck,
      hand: [],
      lifeCloth: [],
      lrigZone: [null, null, null],
      signiZone: [null, null, null],
      enerZone: [],
      trash: [],
      lrigTrash: [],
      checkZone: [null],
    };

    // 4. Tạo GameState ban đầu hoàn chỉnh
    const initialGameState: GameState = {
      gameStarted: true,
      phase: "selecting_lrigs", // Chuyển sang phase chọn LRIG
      turn: 0,
      player: initialPlayerState,
      ai: initialPlayerState, // Tạm thời AI dùng chung state
      logs: useGameStore.getState().logs, // Giữ lại log cũ
      actionTakenInPhase: false,
      playerAction: null,
      isZoneViewerOpen: false,
      viewingLrigDeckForGrow: null,
      mustDiscard: false,
    };

    // 5. Khởi tạo game với state đã chuẩn bị
    initializeGame(initialGameState);
    addLog("Chọn LRIG để bắt đầu trận đấu.", "system");
  }

  // === PHƯƠNG THỨC MỚI: XÁC NHẬN CHỌN LRIG ===
  public confirmLrigSelection(
    centerUuid: string,
    assist1Uuid: string,
    assist2Uuid: string
  ) {
    const { addLog, updateGame, game } = useGameStore.getState();
    if (!game) return;

    const player = game.player;

    const centerLrig = player.lrigDeck.find(
      (c: CardInstance) => c.uuid === centerUuid
    );
    const assistLrig1 = player.lrigDeck.find(
      (c: CardInstance) => c.uuid === assist1Uuid
    );
    const assistLrig2 = player.lrigDeck.find(
      (c: CardInstance) => c.uuid === assist2Uuid
    );

    if (!centerLrig || !assistLrig1 || !assistLrig2) {
      console.error("Invalid LRIG selection.");
      addLog("Lựa chọn LRIG không hợp lệ.", "system");
      return;
    }

    addLog(`Center LRIG được chọn: ${centerLrig.name}.`, "action");
    addLog(
      `Assist LRIG được chọn: ${assistLrig1.name} & ${assistLrig2.name}.`,
      "action"
    );

    // 1. Thay đổi state bên trong Model
    centerLrig.isFaceUp = true;
    assistLrig1.isFaceUp = true;
    assistLrig2.isFaceUp = true;

    player.lrigZone = [assistLrig1, centerLrig, assistLrig2];
    const initialUuids = [centerUuid, assist1Uuid, assist2Uuid];
    player.lrigDeck = player.lrigDeck.filter(
      (c: CardInstance) => !initialUuids.includes(c.uuid)
    );

    // 2. Rút 5 lá bài đầu tiên
    player.drawCards(5);
    addLog("Rút 5 lá bài khởi đầu.", "action");

    // 3. Chuyển sang phase Mulligan
    game.phase = "mulligan";
    addLog("Bắt đầu giai đoạn Mulligan.", "system");

    // 4. Báo cho Zustand cập nhật UI
    updateGame(game);
  }

  // === PHƯƠNG THỨC MỚI: XÁC NHẬN MULLIGAN ===
  public confirmMulligan(cardsToReturnUuids: string[]) {
    const { addLog, updateGame, game } = useGameStore.getState();
    if (!game) return;

    const player = game.player;
    const amountToRedraw = cardsToReturnUuids.length;

    if (amountToRedraw > 0) {
      addLog(`Đổi ${amountToRedraw} lá bài.`, "action");
      // Logic trả bài về deck
      const cardsToReturn = player.hand.filter((c: CardInstance) =>
        cardsToReturnUuids.includes(c.uuid)
      );
      player.hand = player.hand.filter(
        (c: CardInstance) => !cardsToReturnUuids.includes(c.uuid)
      );
      cardsToReturn.forEach((c: CardInstance) => (c.isFaceUp = false));
      player.mainDeck.push(...cardsToReturn);
      shuffle(player.mainDeck);

      // Rút lại bài
      player.drawCards(amountToRedraw);
    } else {
      addLog("Không đổi bài.", "info");
    }

    // Chia 7 lá Life Cloth
    const lifeClothStack = player.mainDeck.splice(0, 7);
    player.lifeCloth = lifeClothStack;
    addLog("Chia 7 lá Life Cloth.", "system");

    // Bắt đầu game
    game.phase = "up";
    game.turn = 1;

    const phaseText = game.phase.charAt(0).toUpperCase() + game.phase.slice(1);
    addLog(`Bắt đầu Turn ${game.turn} - ${phaseText} Phase`, "system");

    // Cập nhật UI lần cuối cho setup
    updateGame(game);
  }
}

const setupService = new SetupService();
export default setupService;
