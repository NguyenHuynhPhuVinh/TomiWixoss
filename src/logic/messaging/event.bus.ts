// src/logic/messaging/event.bus.ts

import { GameEvent } from "./events.types";

type EventCallback<T = any> = (payload: T) => void;

class EventBus {
  private listeners: Map<GameEvent, EventCallback[]> = new Map();

  on(event: GameEvent, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: GameEvent, callback: EventCallback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  dispatch(event: GameEvent, payload?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(payload));
    }
  }
}

const eventBus = new EventBus();
export default eventBus;
