// src/logic/ecs/systems/setup.system.ts
import { System } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  CardInfoComponent,
  GlobalStateComponent,
  StatusComponent,
  ZoneComponent,
  SideEffectComponent,
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
// import useGameStore from "@/store/gameStore";
import shuffle from "shuffle-array";
import { Entity } from "../ecs.types"; // Import Entity
import gameManager from "../game.manager"; // <-- IMPORT GameManager

export class SetupSystem implements System {
  public update(world: World): void {
    const globalState = world.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
    const actionRequest = world.getComponent(
      GLOBAL_ENTITY,
      ActionRequestComponent
    );

    if (!globalState || !actionRequest || !actionRequest.request) return;

    const { type, payload } = actionRequest.request;
    const sideEffects = world.getComponent(GLOBAL_ENTITY, SideEffectComponent)!;

    // Xử lý các yêu cầu liên quan đến setup
    switch (type) {
      // === THÊM CASE MỚI Ở ĐẦU ===
      case "START_SETUP": {
        if (globalState.phase !== "pre_game") break;

        // Logic validate deck nên được thực hiện ở đây
        // (Tạm thời bỏ qua để đơn giản hóa)
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
        break;
      }
      // ===========================

      // --- YÊU CẦU XÁC NHẬN CHỌN LRIG ---
      case "CONFIRM_LRIG_SELECTION": {
        if (globalState.phase !== "selecting_lrigs") break;

        const { center, assists } = payload; // payload = { center: Entity, assists: Entity[] }

        // Cập nhật ZoneComponent cho các LRIG đã chọn
        const lrigsToPlace = [assists[0], center, assists[1]];
        lrigsToPlace.forEach((entityId, index) => {
          const zone = world.getComponent(entityId, ZoneComponent)!;
          const status = world.getComponent(entityId, StatusComponent)!;
          zone.zone = "lrigZone";
          zone.index = index;
          status.isFaceUp = true;
        });

        sideEffects.queue.push({
          type: "LOG",
          message: "Đã chọn LRIG. Rút 5 lá bài khởi đầu.",
          logType: "action",
        });

        // Rút 5 lá bài đầu tiên (logic giống DrawSystem)
        this.drawInitialHand(world, 5);

        globalState.phase = "mulligan";
        sideEffects.queue.push({
          type: "LOG",
          message: "Bắt đầu giai đoạn Mulligan.",
          logType: "system",
        });
        break;
      }

      // --- YÊU CẦU XÁC NHẬN MULLIGAN ---
      case "CONFIRM_MULLIGAN": {
        if (globalState.phase !== "mulligan") break;

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
            const zone = world.getComponent(entity, ZoneComponent)!;
            const status = world.getComponent(entity, StatusComponent)!;
            zone.zone = "mainDeck";
            status.isFaceUp = false;
          });

          // Xáo lại deck
          this.shuffleMainDeck(world);

          // Rút lại bài
          this.drawInitialHand(world, amountToRedraw);
        } else {
          sideEffects.queue.push({
            type: "LOG",
            message: "Không đổi bài.",
            logType: "info",
          });
        }

        // Chia Life Cloth
        const lifeClothEntities = this.getTopCardsOfDeck(world, 7);
        lifeClothEntities.forEach((entity, index) => {
          const zone = world.getComponent(entity, ZoneComponent)!;
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

        // Khởi động vòng lặp tự động cho các phase đầu tiên
        gameManager.startLoop();
        break;
      }
    }
  }

  // --- CÁC HÀM HELPER ---
  private getTopCardsOfDeck(world: World, amount: number): number[] {
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

  private drawInitialHand(world: World, amount: number) {
    const cardsToDraw = this.getTopCardsOfDeck(world, amount);
    cardsToDraw.forEach((entity) => {
      const zone = world.getComponent(entity, ZoneComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;
      zone.zone = "hand";
      status.isFaceUp = true;
      zone.index = 0;
    });
    // Cập nhật lại index cho các lá còn lại trong deck
    this.reindexDeck(world);
  }

  private shuffleMainDeck(world: World) {
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

  private reindexDeck(world: World) {
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
}
