// src/logic/ecs/game.factory.ts
import { World } from "./world";
import { CardData, ZoneKey } from "@/types/game";
import { Entity } from "./ecs.types";
// XÓA: import gameManager from "./game.manager"; // <-- Loại bỏ circular dependency
import { GameManager } from "./game.manager"; // Chỉ import type cho TypeScript

export const GLOBAL_ENTITY = 0;

export class GameFactory {
  // Nhận dependency qua constructor
  constructor(private gameManager: GameManager) {}
  public createEmptyWorld(): World {
    const world = new World();
    const globalEntity = world.createEntity(); // Entity 0

    // Lấy các class component từ registry và tạo instance
    const GlobalStateComponent =
      this.gameManager.getComponentClass("GlobalState")!;
    const ActionRequestComponent =
      this.gameManager.getComponentClass("ActionRequest")!;
    const SideEffectComponent =
      this.gameManager.getComponentClass("SideEffect")!;
    const EffectStackComponent =
      this.gameManager.getComponentClass("EffectStack")!;

    world.addComponent(globalEntity, "GlobalState", new GlobalStateComponent());
    world.addComponent(
      globalEntity,
      "ActionRequest",
      new ActionRequestComponent()
    );
    world.addComponent(globalEntity, "SideEffect", new SideEffectComponent());
    world.addComponent(globalEntity, "EffectStack", new EffectStackComponent());

    return world;
  }

  /**
   * Nạp dữ liệu deck vào một World đã có.
   * @param world - World cần nạp dữ liệu.
   * @param deckData - Dữ liệu deck (mảng các CardData).
   */
  public hydrateDeck(
    world: World,
    mainDeckData: CardData[],
    lrigDeckData: CardData[]
  ): void {
    // Lấy các class component từ registry
    const CardInfoComponent = this.gameManager.getComponentClass("CardInfo")!;
    const StatusComponent = this.gameManager.getComponentClass("Status")!;
    const ZoneComponent = this.gameManager.getComponentClass("Zone")!;

    mainDeckData.forEach((cardData, index) => {
      const entity = world.createEntity();
      world.addComponent(entity, "CardInfo", new CardInfoComponent(cardData));
      world.addComponent(entity, "Status", new StatusComponent());
      world.addComponent(
        entity,
        "Zone",
        new ZoneComponent("player", "mainDeck", index)
      );
    });

    lrigDeckData.forEach((cardData, index) => {
      const entity = world.createEntity();
      world.addComponent(entity, "CardInfo", new CardInfoComponent(cardData));
      world.addComponent(entity, "Status", new StatusComponent());
      world.addComponent(
        entity,
        "Zone",
        new ZoneComponent("player", "lrigDeck", index)
      );
    });

    console.log("World hydrated with deck data.");
  }
}
