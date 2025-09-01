// src/store/slices/uiSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
// === THÊM IMPORT MỚI ===
import {
  initiatePlayerAction,
  cancelPlayerActionInECS,
} from "@/logic/actions.miniplex";

// export type PlayerAction = {
//   type: "place_signi";
//   cardUuid: string; // Thực ra đây là Entity ID dạng string
// };

export interface UiSlice {
  // playerAction: GameStore["playerAction"]; // <-- XÓA
  isZoneViewerOpen: GameStore["isZoneViewerOpen"];
  viewingLrigDeckForGrow: GameStore["viewingLrigDeckForGrow"];
  initiatePlaceSigni: (cardUuid: string) => void; // <-- THAY ĐỔI
  cancelPlayerAction: () => void; // <-- THAY ĐỔI
  openZoneViewer: GameStore["openZoneViewer"];
  closeZoneViewer: GameStore["closeZoneViewer"];
  openLrigDeckViewerForAssist: GameStore["openLrigDeckViewerForAssist"];
  mustDiscard: GameStore["mustDiscard"];
  setMustDiscard: GameStore["setMustDiscard"];
}

export const createUiSlice: StateCreator<GameStore, [], [], UiSlice> = (
  set
) => ({
  // playerAction: null, // <-- XÓA
  isZoneViewerOpen: false,
  viewingLrigDeckForGrow: null,
  mustDiscard: false,

  initiatePlaceSigni: (cardUuid) => {
    // === THAY ĐỔI: Gọi ECS action thay vì set state trong Zustand ===
    console.log(
      `[STORE->ECS] Action: initiatePlaceSigni, cardUuid: ${cardUuid}`
    );
    initiatePlayerAction({ type: "place_signi", cardUuid });
  },
  cancelPlayerAction: () => {
    // === THAY ĐỔI: Gọi ECS action thay vì set state trong Zustand ===
    console.log("[STORE->ECS] Action: cancelPlayerAction");
    cancelPlayerActionInECS();
  },

  openZoneViewer: () => set((state) => ({ ...state, isZoneViewerOpen: true })),
  closeZoneViewer: () =>
    set((state) => ({
      ...state,
      isZoneViewerOpen: false,
      viewingLrigDeckForGrow: null, // <-- QUAN TRỌNG: Reset state này khi đóng
    })),

  openLrigDeckViewerForAssist: (zoneIndex) => {
    set((state) => ({
      ...state,
      isZoneViewerOpen: true,
      viewingLrigDeckForGrow: { forAssistIndex: zoneIndex },
    }));
  },
  setMustDiscard: (mustDiscard) => set((state) => ({ ...state, mustDiscard })),
});
