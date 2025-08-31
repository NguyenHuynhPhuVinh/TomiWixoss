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
  openLrigDeckViewerForAssist: GameStore["openLrigDeckViewerForAssist"];
  closeLrigDeckViewer: GameStore["closeLrigDeckViewer"];
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
  closeZoneViewer: () => set({ isZoneViewerOpen: false }),

  openLrigDeckViewerForAssist: (zoneIndex) => {
    set({
      isZoneViewerOpen: true,
      viewingLrigDeckForGrow: { forAssistIndex: zoneIndex },
    });
  },

  closeLrigDeckViewer: () => {
    set({ isZoneViewerOpen: false, viewingLrigDeckForGrow: null });
  },
});
