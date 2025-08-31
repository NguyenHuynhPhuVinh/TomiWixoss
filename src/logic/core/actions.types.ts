// src/logic/core/actions.types.ts
import { Entity } from "../ecs/ecs.types";

// Định nghĩa payload cho từng loại action
interface StartSetupPayload {}
interface ConfirmLrigSelectionPayload {
  center: Entity;
  assists: Entity[];
}
interface ConfirmMulliganPayload {
  entities: Entity[];
}
interface AdvancePhasePayload {}
interface ChargeEnerPayload {
  source: "hand" | "signi";
  entityId: Entity;
}
interface GrowLrigPayload {
  targetEntityId: Entity;
  zoneIndex: number;
}
interface PlaceSigniPayload {
  entityId: Entity;
  zoneIndex: number;
}
interface DiscardCardPayload {
  entityId: Entity;
}

// Sử dụng Discriminated Unions để tạo ra kiểu GameAction tổng hợp
export type GameAction =
  | { type: "START_SETUP"; payload: StartSetupPayload }
  | { type: "CONFIRM_LRIG_SELECTION"; payload: ConfirmLrigSelectionPayload }
  | { type: "CONFIRM_MULLIGAN"; payload: ConfirmMulliganPayload }
  | { type: "ADVANCE_PHASE"; payload: AdvancePhasePayload }
  | { type: "CHARGE_ENER"; payload: ChargeEnerPayload }
  | { type: "GROW_LRIG"; payload: GrowLrigPayload }
  | { type: "PLACE_SIGNI"; payload: PlaceSigniPayload }
  | { type: "DISCARD_CARD"; payload: DiscardCardPayload };

// Helper để lấy ra kiểu Type của Action
export type GameActionType = GameAction["type"];
