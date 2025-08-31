// src/logic/core/setup.service.ts
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { validateDeck } from "../deckValidation";
import { CardData, CardInstance } from "@/types/game";
import { v4 as uuidv4 } from "uuid";
import shuffle from "shuffle-array";
import useGameStore from "@/store/gameStore";
import { PlayerState } from "@/store/types";

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
    const { addLog, setPhase } = useGameStore.getState();
    addLog("Bắt đầu chuẩn bị trận đấu...", "system");

    // ... logic validateDeck như cũ ...
    const fullMainDeckData = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((c) => Array(4).fill(c))
      .slice(0, 40);
    const fullLrigDeckData = divaDebutDeckEn.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );
    const validation = validateDeck(fullMainDeckData, fullLrigDeckData);
    if (!validation.isValid) {
      addLog("Bộ bài không hợp lệ: " + validation.errors.join(", "), "system");
      return;
    }

    addLog("Bộ bài hợp lệ. Xáo bài...", "system");
    const mainDeck = fullMainDeckData.map((d) =>
      createCardInstance(d, "player")
    );
    shuffle(mainDeck);
    const lrigDeck = fullLrigDeckData.map((d) =>
      createCardInstance(d, "player")
    );

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

    // Cập nhật state với deck đã xáo
    useGameStore.getState().setPlayer(initialPlayerState);
    useGameStore.getState().setAi(initialPlayerState); // Giả sử AI cũng dùng deck giống

    // Chuyển sang phase chọn LRIG
    setPhase("selecting_lrigs");
    addLog("Chọn LRIG để bắt đầu trận đấu.", "system");
  }

  public confirmLrigSelection(selectedUuids: string[]) {
    const { addLog, setPhase, getPlayer, drawCards } = useGameStore.getState();
    const player = getPlayer();
    if (!player) return;

    // Kiểm tra selectedUuids hợp lệ (tối đa 3 LRIG)
    if (selectedUuids.length > 3) {
      addLog("Chỉ được chọn tối đa 3 LRIG.", "system");
      return;
    }

    // Đặt LRIG vào lrigZone
    selectedUuids.forEach((uuid: string, index: number) => {
      const lrig = player.lrigDeck.find((c: CardInstance) => c.uuid === uuid);
      if (lrig) {
        player.lrigZone[index] = { ...lrig, isFaceUp: true };
        player.lrigDeck = player.lrigDeck.filter(
          (c: CardInstance) => c.uuid !== uuid
        );
      }
    });

    // Xóa các LRIG không chọn khỏi deck
    player.lrigDeck = player.lrigDeck.filter(
      (c: CardInstance) => !selectedUuids.includes(c.uuid)
    );

    // Rút 5 lá bài đầu
    drawCards(5);

    // Chuyển sang phase mulligan
    setPhase("mulligan");
    addLog("Rút 5 lá bài. Chọn bài để Mulligan nếu muốn.", "system");
  }

  public confirmMulligan(discardUuids: string[]) {
    const { addLog, setPhase, getPlayer, drawCards, initializeGame } =
      useGameStore.getState();
    const player = getPlayer();
    if (!player) return;

    // Loại bỏ các lá bài discard
    player.hand = player.hand.filter(
      (c: CardInstance) => !discardUuids.includes(c.uuid)
    );
    player.mainDeck.push(
      ...discardUuids
        .map(
          (uuid: string) =>
            player.hand.find((c: CardInstance) => c.uuid === uuid)!
        )
        .filter(Boolean)
    );
    shuffle(player.mainDeck);

    // Rút lại số lá bài đã discard
    drawCards(discardUuids.length);

    // Khởi tạo game đầy đủ
    initializeGame({
      gameStarted: true,
      turn: 1,
      phase: "up",
      player: player,
      ai: useGameStore.getState().getAi() || player, // Giả sử AI
      logs: [],
      actionTakenInPhase: false,
      playerAction: null,
      isZoneViewerOpen: false,
      viewingLrigDeckForGrow: null,
      mustDiscard: false,
    });
    addLog("Setup hoàn tất. Bắt đầu Turn 1 - Up Phase", "system");
  }
}

const setupService = new SetupService();
export default setupService;
