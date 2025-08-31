// src/logic/ecs/game.factory.ts
import { World } from "./world";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import shuffle from "shuffle-array";
import { CardData } from "@/types/game";
import {
  CardInfoComponent,
  ZoneComponent,
  StatusComponent,
  GlobalStateComponent,
  ActionRequestComponent, // <-- IMPORT
} from "./components/card.components";

// Định nghĩa một hằng số cho entity toàn cục để dễ nhận biết
export const GLOBAL_ENTITY = 0;

export class GameFactory {
  /**
   * Tạo ra một World mới, sẵn sàng để bắt đầu một trận đấu.
   */
  public createNewGame(): World {
    const world = new World();

    // === 2. TẠO ENTITY TOÀN CỤC VÀ GẮN COMPONENT ===
    const globalEntity = world.createEntity(); // Sẽ là entity 0
    world.addComponent(
      globalEntity,
      new GlobalStateComponent("pre_game", 0, false)
    );
    world.addComponent(globalEntity, new ActionRequestComponent()); // <-- THÊM VÀO ĐÂY
    // ===============================================

    // 1. Lấy dữ liệu deck
    const mainDeckData = divaDebutDeckEn
      .filter((c) => c.backType === "MAIN")
      .flatMap((card) => Array(4).fill(card))
      .slice(0, 40);
    const lrigDeckData = divaDebutDeckEn.filter(
      (c) => c.backType === "LRIG" || c.backType === "PIECE"
    );
    shuffle(mainDeckData);

    // 2. Tạo các Entity cho mỗi lá bài trong Main Deck
    mainDeckData.forEach((cardData, index) => {
      this.createCardEntity(world, cardData, "player", "mainDeck", index);
    });

    // 3. Tạo các Entity cho mỗi lá bài trong LRIG Deck
    lrigDeckData.forEach((cardData, index) => {
      this.createCardEntity(world, cardData, "player", "lrigDeck", index);
    });

    // TODO: Thêm các System vào World ở đây
    // world.addSystem(new UpSystem());
    // world.addSystem(new DrawSystem());

    console.log("New game world created!", world);
    return world;
  }

  /**
   * Helper để tạo một Entity lá bài hoàn chỉnh với các Component cơ bản.
   */
  private createCardEntity(
    world: World,
    cardData: CardData,
    owner: "player" | "ai",
    zone: any, // Tạm dùng any, sẽ sửa sau
    index: number
  ): void {
    const cardEntity = world.createEntity();

    // Gắn các component cho nó
    world.addComponent(cardEntity, new CardInfoComponent(cardData));
    world.addComponent(cardEntity, new StatusComponent(false, false)); // Mặc định úp và đứng
    world.addComponent(cardEntity, new ZoneComponent(owner, zone, index));
  }
}
