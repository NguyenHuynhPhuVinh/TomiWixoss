// src/logic/actions.miniplex.ts

import { world, globalEntity } from "./ecs/world.miniplex";
import { Entity } from "./ecs/types.miniplex";
import { TURN_PHASES } from "@/types/game";
import shuffle from "shuffle-array"; // Thêm import này
import { checkCost } from "@/logic/payment"; // Thêm import này
import { CardInstance } from "@/types/game"; // Thêm import này
import { GameEvent } from "./messaging/events.types"; // Thêm import này
import eventBus from "./messaging/event.bus"; // Thêm import này
import { getValidGrowOptions } from "./ecs/selectors.miniplex"; // <-- THÊM IMPORT NÀY
import {
  getTopCardsOfDeck,
  reindexDeck,
  drawInitialHand,
  shuffleMainDeck,
  reindexLrigDeck, // <--- THÊM IMPORT NÀY
} from "./ecs/utils.miniplex"; // <-- THÊM IMPORT NÀY
// === THAY ĐỔI: Import constants ===
import { GamePhase, Zone, CardType } from "@/logic/constants";
import { PlayerActionPayload } from "./ecs/types.miniplex"; // <-- THÊM IMPORT
import i18n from "@/i18n"; // Import i18next instance để dịch các chuỗi nhỏ
import useGameStore from "@/store/gameStore"; // <-- Add import for useGameStore

// --- Helper Function ---
function findEntity(uuid: string): Entity | undefined {
  return Array.from(world.with("uuid")).find((e: Entity) => e.uuid === uuid);
}

/**
 * Hành động: Nạp một lá bài vào Ener Zone.
 * Gom logic của chargeEnerReducer và chargeEnerSaga.
 * @param entityUuid - UUID của lá bài cần nạp.
 */
export function chargeEnerAction(entityUuid: string) {
  const { globalState, sideEffectQueue } = globalEntity;

  if (globalState?.phase !== GamePhase.ENER || globalState.actionTakenInPhase) {
    // <-- Sử dụng hằng số
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.invalidPhase",
      logType: "info",
    });
    return;
  }

  // Tìm entity trong world bằng UUID của nó
  // `archetype` là một cách query hiệu quả khác của Miniplex
  const entityToCharge = findEntity(entityUuid);

  if (
    !entityToCharge ||
    !entityToCharge.zone ||
    !entityToCharge.status ||
    !entityToCharge.cardInfo
  ) {
    console.error(
      `Entity ${entityUuid} không tồn tại hoặc thiếu component để nạp ener.`
    );
    return;
  }

  const source = entityToCharge.zone.zone === Zone.HAND ? "tay" : "sân"; // <-- Sử dụng hằng số

  // --- Logic từ Reducer cũ được chuyển vào đây ---
  entityToCharge.zone.zone = Zone.ENER_ZONE; // <-- Sử dụng hằng số
  entityToCharge.status.isFaceUp = true;

  // Đánh dấu đã thực hiện hành động
  globalState.actionTakenInPhase = true;

  // --- Logic từ Saga cũ cũng được chuyển vào đây ---
  // Dịch nguồn trước khi gửi đi
  const sourceKey = source === "tay" ? "hand" : "field";
  const sourceText = i18n.t(`logs.enerChargeSource.${sourceKey}`);

  // Gửi LOG CÓ CẤU TRÚC
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.enerCharge",
    payload: {
      source: sourceText,
      cardName: entityToCharge.cardInfo.data.name,
    },
    logType: "action",
  });
}

/**
 * Hành động: Bỏ một lá bài vào mộ.
 * Gom logic của discardCardReducer.
 * @param entityUuid - UUID của lá bài cần bỏ.
 */
export function discardCardAction(entityUuid: string) {
  const { globalState, sideEffectQueue } = globalEntity;

  // Tìm entity trong world
  const entityToDiscard = findEntity(entityUuid);

  if (
    !entityToDiscard ||
    !entityToDiscard.zone ||
    !entityToDiscard.status ||
    !entityToDiscard.cardInfo
  ) {
    console.error(
      `Entity ${entityUuid} không tồn tại hoặc thiếu component để bỏ bài.`
    );
    return;
  }

  // --- THAY ĐỔI BẮT ĐẦU TỪ ĐÂY ---

  // 1. Đếm số lá bài hiện có trong mộ TRƯỚC KHI thêm lá mới
  const trashEntities = world
    .with("zone")
    .where((e: Entity) => e.zone?.zone === Zone.TRASH);
  const currentTrashSize = Array.from(trashEntities).length;

  // 2. Di chuyển lá bài vào mộ và gán index mới
  entityToDiscard.zone.zone = Zone.TRASH;
  entityToDiscard.zone.index = currentTrashSize; // Lá đầu tiên index 0, lá thứ hai index 1, ...

  // --- KẾT THÚC THAY ĐỔI ---

  // Log action
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.discard",
    payload: { cardName: entityToDiscard.cardInfo.data.name },
    logType: "action",
  });

  // Phát sự kiện
  eventBus.dispatch(GameEvent.CARD_DISCARDED, {
    entityUuid: entityToDiscard.uuid,
    cardId: entityToDiscard.cardInfo.data.id,
  });

  // Kiểm tra lại hand size
  const handEntities = world.with("zone");
  let handCount = 0;
  for (const e of handEntities) {
    if (e.zone?.zone === Zone.HAND) {
      // <-- Sử dụng hằng số
      handCount++;
    }
  }
  if (handCount <= 6) {
    sideEffectQueue?.queue.push({
      type: "UPDATE_UI_FLAG",
      flag: "mustDiscard",
      value: false,
    });
  }
}

/**
 * Hành động: Chuyển sang phase tiếp theo.
 * Gom logic của advancePhaseReducer.
 */
export function advancePhaseAction() {
  const { globalState, sideEffectQueue } = globalEntity;
  if (!globalState) return;

  const currentPhase = globalState.phase;
  const currentIndex = TURN_PHASES.indexOf(currentPhase);
  let nextIndex = currentIndex + 1;

  // Logic chuyển turn
  if (nextIndex >= TURN_PHASES.length) {
    nextIndex = 0; // Quay về Up Phase
    globalState.turn += 1;
  }

  const nextPhase = TURN_PHASES[nextIndex];
  globalState.phase = nextPhase;
  globalState.actionTakenInPhase = false; // Reset cờ cho phase mới

  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.phaseChange",
    payload: {
      turn: globalState.turn,
      phase: nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1),
    },
    logType: "system",
  });
}

/**
 * Hành động: Toggle lựa chọn mulligan cho một lá bài.
 * @param entityUuid - UUID của lá bài cần toggle.
 */
export function updateMulliganSelectionAction(entityUuid: string) {
  const { globalState } = globalEntity;

  if (globalState?.phase !== GamePhase.MULLIGAN) {
    // <-- Sử dụng hằng số
    console.warn("Không thể cập nhật mulligan selection ngoài phase mulligan.");
    return;
  }

  const currentSelection = globalState.mulliganSelection || [];
  const isSelected = currentSelection.includes(entityUuid);

  if (isSelected) {
    // Bỏ chọn
    globalState.mulliganSelection = currentSelection.filter(
      (uuid) => uuid !== entityUuid
    );
  } else {
    // Chọn thêm
    globalState.mulliganSelection = [...currentSelection, entityUuid];
  }

  // Trigger re-render since UI state changed
  useGameStore.getState().incrementWorldVersion();
}

/**
 * Hành động: Bắt đầu quá trình chuẩn bị game.
 * Chuyển từ phase 'pre_game' sang 'selecting_lrigs'.
 */
export function startSetupAction() {
  const { globalState, sideEffectQueue } = globalEntity;
  if (!globalState || globalState.phase !== GamePhase.PRE_GAME) {
    // <-- Sử dụng hằng số
    return; // Không làm gì nếu không ở đúng phase
  }

  // Logic từ startSetupReducer cũ
  globalState.phase = GamePhase.SELECTING_LRIGS; // <-- Sử dụng hằng số

  // Gửi side effect để ghi log
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.setupStart",
    logType: "system",
  });
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.selectLrigs",
    logType: "system",
  });
}

/**
 * Hành động: Xác nhận lựa chọn LRIG và bắt đầu game.
 * @param centerUuid UUID của Center LRIG
 * @param assistUuids Mảng UUID của 2 Assist LRIG
 */
export function confirmLrigSelectionAction(
  centerUuid: string,
  assistUuids: string[]
) {
  const { globalState, sideEffectQueue } = globalEntity;
  if (!globalState || globalState.phase !== GamePhase.SELECTING_LRIGS) return; // <-- Sử dụng hằng số

  const lrigsToPlace = [assistUuids[0], centerUuid, assistUuids[1]];

  lrigsToPlace.forEach((uuid, index) => {
    const entity = findEntity(uuid);
    if (entity && entity.zone && entity.status) {
      entity.zone.zone = Zone.LRIG_ZONE; // <-- Sử dụng hằng số
      entity.zone.index = index;
      entity.status.isFaceUp = true;
    }
  });

  // DỌN DẸP LẠI LRIG DECK SAU KHI CHỌN LRIG KHỞI ĐẦU
  reindexLrigDeck(); // <--- THÊM DÒNG NÀY VÀO ĐÂY

  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.lrigsSelected",
    logType: "action",
  });

  // Rút 5 lá bài đầu tiên (logic từ setup.reducer cũ)
  drawInitialHand(5);

  globalState.phase = GamePhase.MULLIGAN; // <-- Sử dụng hằng số
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.mulliganStart",
    logType: "system",
  });
}

/**
 * Hành động: Xác nhận lựa chọn mulligan, đổi bài và bắt đầu game.
 */
export function confirmMulliganAction() {
  const { globalState, sideEffectQueue } = globalEntity;
  if (!globalState || globalState.phase !== GamePhase.MULLIGAN) return; // <-- Sử dụng hằng số

  const cardsToReturnUuids = globalState.mulliganSelection;
  const amountToRedraw = cardsToReturnUuids.length;

  if (amountToRedraw > 0) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.mulligan.confirm",
      payload: { count: amountToRedraw },
      logType: "action",
    });

    // Trả bài về deck
    cardsToReturnUuids.forEach((uuid) => {
      const entity = findEntity(uuid);
      if (entity && entity.zone && entity.status) {
        entity.zone.zone = Zone.MAIN_DECK; // <-- Sử dụng hằng số
        entity.status.isFaceUp = false;
      }
    });

    // Xáo lại deck
    shuffleMainDeck();

    // Rút lại bài
    drawInitialHand(amountToRedraw);
  } else {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.mulligan.skip",
      logType: "info",
    });
  }

  // Chia Life Cloth (7 lá)
  const lifeClothEntities = getTopCardsOfDeck(7);
  lifeClothEntities.forEach((entity, index) => {
    if (entity.zone) {
      entity.zone.zone = Zone.LIFE_CLOTH; // <-- Sử dụng hằng số
      entity.zone.index = index;
    }
  });
  reindexDeck(); // Cập nhật lại index cho deck sau khi chia life cloth
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.mulligan.lifeClothSet",
    logType: "system",
  });

  // Reset mulligan selection
  globalState.mulliganSelection = [];

  // Bắt đầu game
  globalState.phase = GamePhase.UP; // <-- Sử dụng hằng số
  globalState.turn = 1;
  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.mulligan.gameStart",
    logType: "system",
  });
}

/**
 * Hành động: Đặt một SIGNI từ tay ra sân.
 * @param entityUuid UUID của lá SIGNI trên tay.
 * @param zoneIndex Vị trí ô SIGNI (0, 1, hoặc 2).
 */
export function placeSigniAction(entityUuid: string, zoneIndex: number) {
  const { globalState, sideEffectQueue } = globalEntity;
  if (globalState?.phase !== GamePhase.MAIN) {
    // <-- Sử dụng hằng số
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.invalidPhase",
      logType: "info",
    });
    return;
  }

  const entities = world.with("uuid", "zone", "status", "cardInfo");
  const cardToPlay = findEntity(entityUuid);

  const lrigs = world.with("zone", "cardInfo");
  const centerLrig = Array.from(lrigs).find(
    (e) => e.zone.zone === Zone.LRIG_ZONE && e.zone.index === 1 // <-- Sử dụng hằng số
  );

  if (!cardToPlay?.cardInfo || !centerLrig?.cardInfo) {
    console.error("Yêu cầu đặt SIGNI không hợp lệ.");
    return;
  }

  // Kiểm tra Level & Limit (logic từ reducer cũ)
  const lrigLevel = centerLrig.cardInfo.data.level ?? 0;
  const lrigLimit = centerLrig.cardInfo.data.limit ?? 99;
  const cardLevel = cardToPlay.cardInfo.data.level ?? 0;

  if (cardLevel > lrigLevel) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.placeSigniError.level",
      payload: { requiredLevel: lrigLevel },
      logType: "info",
    });
    return;
  }

  const signiOnField = Array.from(
    world.with("zone", "cardInfo").where((e) => e.zone.zone === Zone.SIGNI_ZONE) // <-- Sử dụng hằng số
  );
  const currentTotalLevel = signiOnField.reduce(
    (sum, entity) => sum + (entity.cardInfo!.data.level ?? 0),
    0
  );

  if (currentTotalLevel + cardLevel > lrigLimit) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.placeSigniError.limit",
      payload: { limit: lrigLimit },
      logType: "info",
    });
    return;
  }

  // Thực thi hành động
  cardToPlay.zone!.zone = Zone.SIGNI_ZONE; // <-- Sử dụng hằng số
  cardToPlay.zone!.index = zoneIndex;
  cardToPlay.status!.isFaceUp = true;

  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.placeSigni",
    payload: {
      cardName: cardToPlay.cardInfo.data.name,
      position: zoneIndex + 1,
    },
    logType: "action",
  });

  // Phát sự kiện để các hệ thống khác (như scripting) có thể lắng nghe
  eventBus.dispatch(GameEvent.CARD_PLAYED, {
    entityUuid: cardToPlay.uuid, // Gửi UUID (string)
    cardId: cardToPlay.cardInfo.data.id,
    zone: Zone.SIGNI_ZONE, // <-- Sử dụng hằng số
    zoneIndex,
  });
}

/**
 * Hành động: Grow một LRIG.
 * @param targetEntityUuid UUID của lá LRIG trong LRIG Deck.
 * @param zoneIndex Vị trí LRIG trên sân (0, 1, hoặc 2).
 */
export function growLrigAction(targetEntityUuid: string, zoneIndex: number) {
  const { globalState, sideEffectQueue } = globalEntity;
  if (!globalState) return;

  // --- 1. KIỂM TRA ĐIỀU KIỆN GROW HỢP LỆ ---
  // Lấy danh sách các lựa chọn hợp lệ
  const validOptions = getValidGrowOptions(globalState.phase, zoneIndex);
  // Kiểm tra xem lá bài được click có nằm trong danh sách đó không
  const isValidChoice = validOptions.some(
    (entity) => entity.uuid === targetEntityUuid
  );

  if (!isValidChoice) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.growLrigError.invalid",
      logType: "info",
    });
    return; // Dừng lại nếu không hợp lệ
  }

  // --- 2. LẤY DỮ LIỆU ENTITY ---
  // Bây giờ chúng ta biết chắc chắn các entity này tồn tại và hợp lệ
  const targetLrig = findEntity(targetEntityUuid)!;
  const currentLrig = Array.from(world.with("zone")).find(
    (e) => e.zone.zone === Zone.LRIG_ZONE && e.zone.index === zoneIndex // <-- Sử dụng hằng số
  )!;

  // Đóng modal ngay lập tức
  sideEffectQueue?.queue.push({
    type: "UPDATE_UI_FLAG",
    flag: "isZoneViewerOpen",
    value: false,
  });

  // --- 3. THANH TOÁN COST ---
  const enerZoneEntities = Array.from(
    world
      .with("zone", "cardInfo", "status", "uuid")
      .where((e) => e.zone.zone === Zone.ENER_ZONE) // <-- Sử dụng hằng số
  );
  const enerZoneCards: CardInstance[] = enerZoneEntities.map((e) => ({
    ...e.cardInfo!.data,
    ...e.status!,
    uuid: e.uuid,
    owner: e.zone!.owner,
  }));
  const cost = targetLrig.cardInfo!.data.growCost;
  const paymentResult = checkCost(cost, enerZoneCards);

  if (!paymentResult.canPay) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.growLrigError.cost",
      logType: "info",
    });
    return;
  }

  // Trừ Ener
  paymentResult.paidEner.forEach((paidCard) => {
    const paidEntity = findEntity(paidCard.uuid);
    if (paidEntity) paidEntity.zone!.zone = Zone.TRASH; // <-- Sử dụng hằng số
  });
  if (paymentResult.paidEner.length > 0) {
    sideEffectQueue?.queue.push({
      type: "LOG",
      key: "logs.growLrigCost",
      payload: { count: paymentResult.paidEner.length },
      logType: "cost",
    });
  }

  // --- 4. THỰC HIỆN GROW ---
  // Gom các lá bài cũ lại
  const oldCardsStack: Entity[] = [
    currentLrig,
    ...(currentLrig.underneath?.entities ?? []),
  ];

  // Di chuyển các lá cũ vào "underneath"
  oldCardsStack.forEach((entity) => {
    if (entity.zone) entity.zone.zone = Zone.UNDERNEATH; // <-- Sử dụng hằng số
  });

  // Đặt LRIG mới ra sân
  targetLrig.zone!.zone = Zone.LRIG_ZONE; // <-- Sử dụng hằng số
  targetLrig.zone!.index = zoneIndex;
  targetLrig.status!.isFaceUp = true;
  // Gắn các lá bài cũ vào bên dưới LRIG mới
  targetLrig.underneath = { entities: oldCardsStack };

  // DỌN DẸP LẠI LRIG DECK SAU KHI RÚT BÀI
  reindexLrigDeck(); // <--- THÊM DÒNG NÀY VÀO ĐÂY

  // --- 5. CẬP NHẬT STATE VÀ LOG ---
  // Chỉ set cờ khi Grow Center LRIG trong Grow Phase
  if (zoneIndex === 1 && globalState.phase === GamePhase.GROW) {
    // <-- Sử dụng hằng số
    globalState.actionTakenInPhase = true;
  }

  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.growLrig",
    payload: { cardName: targetLrig.cardInfo!.data.name },
    logType: "action",
  });

  // TODO: Phát sự kiện CARD_GROWN để scripting system xử lý (nếu cần)
  // eventBus.dispatch(...)
}

/**
 * Hành động: Nạp một số lá bài từ trên cùng bộ bài vào ener.
 * Dành cho các hiệu ứng của lá bài (ví dụ từ Lua).
 * @param amount Số lượng lá bài cần nạp.
 */
export function enerChargeAction(amount: number) {
  const { sideEffectQueue } = globalEntity;
  const cardsToCharge = getTopCardsOfDeck(amount);

  if (cardsToCharge.length < amount) {
    console.warn(`Không đủ bài trong deck để nạp ${amount} ener.`);
  }

  cardsToCharge.forEach((entity) => {
    entity.zone!.zone = Zone.ENER_ZONE; // <-- Fix to use constant
    entity.status!.isFaceUp = true;
  });
  reindexDeck();

  sideEffectQueue?.queue.push({
    type: "LOG",
    key: "logs.enerCharged",
    payload: { count: cardsToCharge.length },
    logType: "action",
  });
}

/**
 * Bắt đầu một hành động của người chơi (ví dụ: chọn bài để đặt).
 * @param action - Object hành động.
 */
export function initiatePlayerAction(action: PlayerActionPayload) {
  if (globalEntity.globalState) {
    globalEntity.globalState.playerAction = action;
    // Trigger re-render since UI state changed
    useGameStore.getState().incrementWorldVersion();
  }
}

/**
 * Hủy bỏ hành động hiện tại của người chơi.
 */
export function cancelPlayerActionInECS() {
  if (globalEntity.globalState) {
    globalEntity.globalState.playerAction = null;
    // Trigger re-render since UI state changed
    useGameStore.getState().incrementWorldVersion();
  }
}
