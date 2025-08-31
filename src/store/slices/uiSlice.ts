// src/store/slices/uiSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";

export interface UiSlice {
  playerAction: GameStore["playerAction"];
  isZoneViewerOpen: GameStore["isZoneViewerOpen"];
  viewingLrigDeckForGrow: GameStore["viewingLrigDeckForGrow"];
  initiatePlaceSigni: GameStore["initiatePlaceSigni"];
  cancelPlayerAction: GameStore["cancelPlayerAction"];
  openZoneViewer: GameStore["openZoneViewer"];
  closeZoneViewer: GameStore["closeZoneViewer"];
  closeLrigDeckViewer: GameStore["closeLrigDeckViewer"];
  openLrigDeckViewerForAssist: GameStore["openLrigDeckViewerForAssist"];
}

export const createUiSlice: StateCreator<GameStore, [], [], UiSlice> = (
  set
) => ({
  playerAction: null,
  isZoneViewerOpen: false,
  viewingLrigDeckForGrow: null,

  initiatePlaceSigni: (cardUuid) => {
    console.log(
      `%c[STORE] Action: initiatePlaceSigni, cardUuid: ${cardUuid}`,
      "color: #FFA500"
    );
    set({ playerAction: { type: "place_signi", cardUuid } });
  },
  cancelPlayerAction: () => {
    console.log("%c[STORE] Action: cancelPlayerAction", "color: #FFA500");
    set({ playerAction: null });
  },

  openZoneViewer: () => set({ isZoneViewerOpen: true }),
  closeZoneViewer: () =>
    set({
      isZoneViewerOpen: false,
      viewingLrigDeckForGrow: null, // <-- QUAN TRỌNG: Reset state này khi đóng
    }),
  closeLrigDeckViewer: () =>
    set({
      isZoneViewerOpen: false,
      viewingLrigDeckForGrow: null,
    }),

  openLrigDeckViewerForAssist: (zoneIndex) => {
    set({
      isZoneViewerOpen: true,
      viewingLrigDeckForGrow: { forAssistIndex: zoneIndex },
    });
  },
});
