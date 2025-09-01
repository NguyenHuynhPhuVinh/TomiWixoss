// src/logic/messaging/events.types.ts

export enum GameEvent {
  CARD_PLAYED = "CARD_PLAYED",
  CARD_DISCARDED = "CARD_DISCARDED",
  LRIG_GROWN = "LRIG_GROWN",
  // Thêm các event khác nếu cần
}

// Định nghĩa payload cho từng event
export type GameEventPayloads = {
  [GameEvent.CARD_PLAYED]: {
    entityUuid: string;
    cardId: string;
    zone: string;
    zoneIndex: number;
  };
  [GameEvent.CARD_DISCARDED]: {
    entityUuid: string;
    cardId: string;
  };
  [GameEvent.LRIG_GROWN]: {
    entityUuid: string;
    cardId: string;
    zoneIndex: number;
  };
  // ... các event khác
};
