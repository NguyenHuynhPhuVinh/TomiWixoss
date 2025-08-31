// src/logic/core/event.bus.ts
import { GameEvent, GameEventPayloads } from "./events.types"; // <-- IMPORT

// Định nghĩa listener với kiểu chặt chẽ
type EventListener<E extends GameEvent> = (
  payload: GameEventPayloads[E]
) => void;

class EventBus {
  private listeners: Map<GameEvent, EventListener<any>[]> = new Map();

  public on<E extends GameEvent>(
    event: E,
    listener: EventListener<E>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return () => this.off(event, listener);
  }

  public off<E extends GameEvent>(event: E, listener: EventListener<E>): void {
    if (!this.listeners.has(event)) return;

    const eventListeners = this.listeners.get(event)!;
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  public dispatch<E extends GameEvent>(
    event: E,
    payload: GameEventPayloads[E]
  ): void {
    console.log(`%cEVENT: ${event}`, "color: #8E44AD", payload);
    if (!this.listeners.has(event)) return;
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
