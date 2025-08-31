// src/logic/ecs/game.manager.ts
import { World } from "./world";
import { GameFactory } from "./game.factory";
import { UpSystem } from "./systems/up.system";
import { DrawSystem } from "./systems/draw.system";
import { EnerSystem } from "./systems/ener.system"; // <-- IMPORT

type UpdateListener = (world: World) => void;

class GameManager {
  public world: World | null = null;
  private factory = new GameFactory();
  private updateListeners: UpdateListener[] = [];
  private isLooping = false;
  private animationFrameId: number = 0;

  public createNewGame(): World {
    this.world = this.factory.createNewGame();
    this.world.addSystem(new UpSystem());
    this.world.addSystem(new DrawSystem());
    this.world.addSystem(new EnerSystem()); // <-- THÊM VÀO ĐÂY
    // ... thêm các system khác
    return this.world;
  }

  public onUpdate(listener: UpdateListener) {
    this.updateListeners.push(listener);
  }

  private loop() {
    if (!this.isLooping || !this.world) return;

    // Chạy các system
    this.world.update();

    // Thông báo cho listener (Zustand)
    this.updateListeners.forEach((listener) => listener(this.world!));

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  public startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    this.loop();
  }

  public stopLoop() {
    if (!this.isLooping) return;
    this.isLooping = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Tạm dừng vòng lặp, chạy các system một lần, và thông báo cập nhật.
   * Dùng cho các hành động cần phản hồi ngay lập tức từ người chơi.
   */
  public forceUpdate() {
    if (!this.world) return;
    this.stopLoop(); // Tạm dừng vòng lặp tự động

    this.world.update();
    this.updateListeners.forEach((listener) => listener(this.world!));

    this.startLoop(); // Khởi động lại vòng lặp
  }
}

const gameManager = new GameManager();
export default gameManager;
