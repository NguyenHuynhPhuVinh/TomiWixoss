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
interface UpdateMulliganSelectionPayload {
  selection: Entity[];
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
// THÊM PAYLOAD MỚI
interface EnerChargePayload {
  amount: number;
  player: "player" | "ai";
}

// Sử dụng Discriminated Unions để tạo ra kiểu GameAction tổng hợp
export type GameAction =
  | { type: "START_SETUP"; payload: StartSetupPayload }
  | { type: "CONFIRM_LRIG_SELECTION"; payload: ConfirmLrigSelectionPayload }
  | { type: "CONFIRM_MULLIGAN"; payload: ConfirmMulliganPayload }
  | {
      type: "UPDATE_MULLIGAN_SELECTION";
      payload: UpdateMulliganSelectionPayload;
    }
  | { type: "ADVANCE_PHASE"; payload: AdvancePhasePayload }
  | { type: "CHARGE_ENER"; payload: ChargeEnerPayload }
  | { type: "GROW_LRIG"; payload: GrowLrigPayload }
  | { type: "PLACE_SIGNI"; payload: PlaceSigniPayload }
  | { type: "DISCARD_CARD"; payload: DiscardCardPayload }
  // THÊM ACTION MỚI
  | { type: "ENER_CHARGE"; payload: EnerChargePayload };

// Helper để lấy ra kiểu Type của Action
export type GameActionType = GameAction["type"];
