// src/logic/core/event.service.ts

// Định nghĩa các loại sự kiện có thể xảy ra trong game
export enum GameEvent {
  PHASE_CHANGED = "PHASE_CHANGED",
  CARD_PLAYED = "CARD_PLAYED",
  CARD_DRAWN = "CARD_DRAWN",
  // Thêm các sự kiện khác sau này
  // TURN_STARTED, ATTACK_DECLARED, DAMAGE_DEALT, ...
}

// Định nghĩa payload (dữ liệu đi kèm) cho mỗi sự kiện
// Ví dụ: khi CARD_PLAYED xảy ra, chúng ta muốn biết lá bài nào đã được chơi
interface EventPayloads {
  [GameEvent.PHASE_CHANGED]: { from: string; to: string; turn: number };
  [GameEvent.CARD_PLAYED]: { cardId: string; player: string };
  [GameEvent.CARD_DRAWN]: { count: number; player: string };
}

// Định nghĩa một listener
type EventListener<T extends GameEvent> = (payload: EventPayloads[T]) => void;

class EventService {
  private listeners: { [key in GameEvent]?: Array<EventListener<key>> } = {};

  /**
   * Đăng ký để lắng nghe một sự kiện.
   * @param event - Tên sự kiện cần lắng nghe.
   * @param listener - Hàm sẽ được gọi khi sự kiện xảy ra.
   * @returns Một hàm để hủy đăng ký.
   */
  public on<T extends GameEvent>(
    event: T,
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener as any);

    // Trả về một hàm để hủy đăng ký
    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Hủy đăng ký lắng nghe một sự kiện.
   */
  public off<T extends GameEvent>(event: T, listener: EventListener<T>): void {
    if (!this.listeners[event]) return;
    const index = this.listeners[event]!.indexOf(listener as any);
    if (index > -1) {
      this.listeners[event]!.splice(index, 1);
    }
  }

  /**
   * Phát ra một sự kiện, thông báo cho tất cả các listener đã đăng ký.
   */
  public dispatch<T extends GameEvent>(
    event: T,
    payload: EventPayloads[T]
  ): void {
    console.log(`%cEVENT DISPATCHED: ${event}`, "color: #2ECC71", payload);
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }
}

const eventService = new EventService();
export default eventService;
