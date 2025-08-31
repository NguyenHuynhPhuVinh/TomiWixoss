// src/logic/core/events.types.ts
import { Entity } from "../ecs/ecs.types";
import { GamePhase } from "@/types/game";

// Danh sách các sự kiện
export enum GameEvent {
  PHASE_CHANGED = "PHASE_CHANGED",
  CARD_PLAYED = "CARD_PLAYED",
  CARD_DRAWN = "CARD_DRAWN",
  CARD_DISCARDED = "CARD_DISCARDED",
  CARD_CHARGED = "CARD_CHARGED",
  CARD_GROWN = "CARD_GROWN",
  CARDS_UPPED = "CARDS_UPPED",
  STOP_GAME_LOOP = "STOP_GAME_LOOP",
}

// Định nghĩa payload cho từng loại event
export type GameEventPayloads = {
  [GameEvent.PHASE_CHANGED]: { from: GamePhase; to: GamePhase; turn: number };
  [GameEvent.CARD_PLAYED]: {
    entityId: Entity;
    cardId: string;
    zone: string;
    zoneIndex: number;
  };
  [GameEvent.CARD_DRAWN]: { drawnEntities: Entity[]; player: string };
  [GameEvent.CARD_DISCARDED]: { entityId: Entity; cardId: string };
  [GameEvent.CARD_CHARGED]: {
    entityId: Entity;
    source: string;
    cardId: string;
  };
  [GameEvent.CARD_GROWN]: {
    entityId: Entity;
    cardId: string;
    zoneIndex: number;
  };
  [GameEvent.CARDS_UPPED]: { uppedEntities: Entity[]; cardIds: string[] };
  [GameEvent.STOP_GAME_LOOP]: {};
};
