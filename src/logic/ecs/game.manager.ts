// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { UpSystem } from "./systems/up.system";

// Một Event Emitter siêu đơn giản
type UpdateListener = (world: World) => void;

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private lastUpdateTime = 0;

  public createNewGame(): World {
    this.world = this.factory.createNewGame();
    this.world.addSystem(new UpSystem());
    // ... thêm các system khác
    return this.world;
  }

  // Phương thức để các hệ thống bên ngoài (như Zustand) đăng ký lắng nghe
  public onUpdate(listener: UpdateListener) {
    this.updateListeners.push(listener);
  }

  // Vòng lặp game chính
  private loop(currentTime: number) {
    if (!this.isLooping) return;

    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Gọi update của world (chạy các system)
    this.world?.update();

    // Thông báo cho tất cả các listener rằng world đã được cập nhật
    if (this.world) {
      this.updateListeners.forEach((listener) => listener(this.world!));
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  public startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    this.lastUpdateTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  public stopLoop() {
    this.isLooping = false;
  }

  /**
   * Thực hiện một lần cập nhật duy nhất, thường được gọi bởi hành động của người chơi.
   */
  public forceUpdate() {
    if (!this.world) return;
    this.world.update();
    // Thông báo cho listener
    this.updateListeners.forEach((listener) => listener(this.world!));
  }
}

const gameManager = new GameManager();
export default gameManager;
