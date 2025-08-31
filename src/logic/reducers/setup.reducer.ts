// src/logic/reducers/setup.reducer.ts
import { World } from "../ecs/world";
import { Reducer } from "../core/reducer.types";
import { Entity } from "../ecs/ecs.types";
import {
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../ecs/components/card.components";
import { GLOBAL_ENTITY } from "../ecs/game.factory";
import shuffle from "shuffle-array";

// START_SETUP Reducer
export const startSetupReducer: Reducer<{
  type: "START_SETUP";
  payload: {};
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;

  if (globalState?.phase !== "pre_game") return;

  // Logic validate deck nên được thực hiện ở đây (tạm thời bỏ qua)
  sideEffects.queue.push({
    type: "LOG",
    message: "Bắt đầu chuẩn bị trận đấu...",
    logType: "system",
  });

  globalState.phase = "selecting_lrigs";
  sideEffects.queue.push({
    type: "LOG",
    message: "Chọn LRIG để bắt đầu trận đấu.",
    logType: "system",
  });
};

// CONFIRM_LRIG_SELECTION Reducer
export const confirmLrigSelectionReducer: Reducer<{
  type: "CONFIRM_LRIG_SELECTION";
  payload: { center: Entity; assists: Entity[] };
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;

  if (globalState?.phase !== "selecting_lrigs") return;

  const { center, assists } = payload;

  // Cập nhật ZoneComponent cho các LRIG đã chọn
  const lrigsToPlace = [assists[0], center, assists[1]];
  lrigsToPlace.forEach((entityId, index) => {
    const zone = draftWorld.getComponent(entityId, ZoneComponent)!;
    const status = draftWorld.getComponent(entityId, StatusComponent)!;
    zone.zone = "lrigZone";
    zone.index = index;
    status.isFaceUp = true;
  });

  sideEffects.queue.push({
    type: "LOG",
    message: "Đã chọn LRIG. Rút 5 lá bài khởi đầu.",
    logType: "action",
  });

  // Rút 5 lá bài đầu tiên
  drawInitialHand(draftWorld, 5);

  globalState.phase = "mulligan";
  sideEffects.queue.push({
    type: "LOG",
    message: "Bắt đầu giai đoạn Mulligan.",
    logType: "system",
  });
};

// UPDATE_MULLIGAN_SELECTION Reducer
export const updateMulliganSelectionReducer: Reducer<{
  type: "UPDATE_MULLIGAN_SELECTION";
  payload: { selection: Entity[] };
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );

  if (globalState?.phase !== "mulligan") return;

  globalState.mulliganSelection = payload.selection;
};

// CONFIRM_MULLIGAN Reducer
export const confirmMulliganReducer: Reducer<{
  type: "CONFIRM_MULLIGAN";
  payload: { entities: Entity[] };
}> = (draftWorld, payload) => {
  const globalState = draftWorld.getComponent(
    GLOBAL_ENTITY,
    GlobalStateComponent
  );
  const sideEffects = draftWorld.getComponent(
    GLOBAL_ENTITY,
    SideEffectComponent
  )!;

  if (globalState?.phase !== "mulligan") return;

  const cardsToReturnEntities: Entity[] = payload.entities;
  const amountToRedraw = cardsToReturnEntities.length;

  if (amountToRedraw > 0) {
    sideEffects.queue.push({
      type: "LOG",
      message: `Đổi ${amountToRedraw} lá bài.`,
      logType: "action",
    });

    // Trả bài về deck
    cardsToReturnEntities.forEach((entity) => {
      const zone = draftWorld.getComponent(entity, ZoneComponent)!;
      const status = draftWorld.getComponent(entity, StatusComponent)!;
      zone.zone = "mainDeck";
      status.isFaceUp = false;
    });

    // Xáo lại deck
    shuffleMainDeck(draftWorld);

    // Rút lại bài
    drawInitialHand(draftWorld, amountToRedraw);
  } else {
    sideEffects.queue.push({
      type: "LOG",
      message: "Không đổi bài.",
      logType: "info",
    });
  }

  // Chia Life Cloth
  const lifeClothEntities = getTopCardsOfDeck(draftWorld, 7);
  lifeClothEntities.forEach((entity, index) => {
    const zone = draftWorld.getComponent(entity, ZoneComponent)!;
    zone.zone = "lifeCloth";
    zone.index = index;
  });
  sideEffects.queue.push({
    type: "LOG",
    message: "Chia 7 lá Life Cloth.",
    logType: "system",
  });

  // Bắt đầu game
  globalState.phase = "up";
  globalState.turn = 1;
  sideEffects.queue.push({
    type: "LOG",
    message: `Bắt đầu Turn 1 - Up Phase`,
    logType: "system",
  });
};

// Helper functions
function getTopCardsOfDeck(world: World, amount: number): number[] {
  const mainDeckEntities = world
    .query([ZoneComponent])
    .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "mainDeck");

  mainDeckEntities.sort((a, b) => {
    const indexA = world.getComponent(a, ZoneComponent)!.index;
    const indexB = world.getComponent(b, ZoneComponent)!.index;
    return indexB - indexA;
  });
  return mainDeckEntities.slice(0, amount);
}

function drawInitialHand(world: World, amount: number) {
  const cardsToDraw = getTopCardsOfDeck(world, amount);
  cardsToDraw.forEach((entity) => {
    const zone = world.getComponent(entity, ZoneComponent)!;
    const status = world.getComponent(entity, StatusComponent)!;
    zone.zone = "hand";
    status.isFaceUp = true;
    zone.index = 0;
  });
  // Cập nhật lại index cho các lá còn lại trong deck
  reindexDeck(world);
}

function shuffleMainDeck(world: World) {
  const mainDeckEntities = world
    .query([ZoneComponent])
    .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "mainDeck");

  shuffle(mainDeckEntities); // Xáo trộn mảng entity ID

  // Gán lại index mới cho các lá bài
  mainDeckEntities.forEach((entity, i) => {
    const zone = world.getComponent(entity, ZoneComponent)!;
    zone.index = i;
  });
}

function reindexDeck(world: World) {
  const mainDeckEntities = world
    .query([ZoneComponent])
    .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "mainDeck");

  mainDeckEntities.sort((a, b) => {
    // Sắp xếp lại để đảm bảo thứ tự đúng
    const indexA = world.getComponent(a, ZoneComponent)!.index;
    const indexB = world.getComponent(b, ZoneComponent)!.index;
    return indexA - indexB;
  });

  mainDeckEntities.forEach((entity, i) => {
    const zone = world.getComponent(entity, ZoneComponent)!;
    zone.index = i;
  });
}
