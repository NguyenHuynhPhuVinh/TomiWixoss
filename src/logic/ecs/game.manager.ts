// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { UpSystem } from "./systems/up.system";

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();

  public createNewGame() {
    this.world = this.factory.createNewGame();

    // Thêm các system vào world
    this.world.addSystem(new UpSystem());
    // ... thêm các system khác

    // Báo cho UI biết là có world mới
    // (Chúng ta sẽ dùng Zustand để làm việc này)
  }

  // Vòng lặp game chính
  public update() {
    if (!this.world) return;
    this.world.update();
  }
}

const gameManager = new GameManager();
export default gameManager;
