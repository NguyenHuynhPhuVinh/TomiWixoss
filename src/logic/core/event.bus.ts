// src/logic/core/event.bus.ts

// Định nghĩa các loại sự kiện có thể xảy ra trong game.
// Chúng ta sẽ mở rộng danh sách này sau.
export enum GameEvent {
  // Sự kiện về vòng lặp và phase
  GAME_STARTED = "GAME_STARTED",
  PHASE_CHANGED = "PHASE_CHANGED",
  STOP_GAME_LOOP = "STOP_GAME_LOOP",

  // Sự kiện về các lá bài
  CARD_PLAYED = "CARD_PLAYED", // Một lá bài được đặt ra sân
  CARD_DRAWN = "CARD_DRAWN", // Một hoặc nhiều lá bài được rút
  CARD_DISCARDED = "CARD_DISCARDED",
  CARD_CHARGED = "CARD_CHARGED",
  CARD_GROWN = "CARD_GROWN",
  CARDS_UPPED = "CARDS_UPPED",

  // Thêm các sự kiện khác sau này...
  // TURN_STARTED, ATTACK_DECLARED, DAMAGE_DEALT, ...
}

// Định nghĩa một listener (hàm callback)
type EventListener = (payload?: any) => void;

class EventBus {
  // Map từ tên sự kiện -> danh sách các hàm lắng nghe
  private listeners: Map<GameEvent, EventListener[]> = new Map();

  /**
   * Đăng ký để lắng nghe một sự kiện.
   * @param event - Tên sự kiện cần lắng nghe.
   * @param listener - Hàm sẽ được gọi khi sự kiện xảy ra.
   * @returns Một hàm để hủy đăng ký.
   */
  public on(event: GameEvent, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    // Trả về một hàm tiện lợi để hủy đăng ký
    return () => this.off(event, listener);
  }

  /**
   * Hủy đăng ký lắng nghe một sự kiện.
   */
  public off(event: GameEvent, listener: EventListener): void {
    if (!this.listeners.has(event)) return;

    const eventListeners = this.listeners.get(event)!;
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  /**
   * Phát ra một sự kiện, thông báo cho tất cả các listener đã đăng ký.
   */
  public dispatch(event: GameEvent, payload?: any): void {
    console.log(`%cEVENT: ${event}`, "color: #8E44AD", payload);
    if (!this.listeners.has(event)) return;

    // Gọi tất cả các listener đã đăng ký cho sự kiện này
    this.listeners.get(event)!.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }
}

// Tạo một instance duy nhất (Singleton pattern)
const eventBus = new EventBus();
export default eventBus;
