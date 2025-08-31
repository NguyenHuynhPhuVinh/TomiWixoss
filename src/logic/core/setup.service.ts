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
    const { addLog, initializeGame } = useGameStore.getState();
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
      /* ... báo lỗi và return ... */
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

    // Tạm thời, chúng ta sẽ khởi tạo game ngay ở đây
    // Sau này sẽ có bước chọn LRIG
    initializeGame({
      gameStarted: true,
      turn: 1,
      phase: "up",
      player: initialPlayerState,
      ai: initialPlayerState,
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
