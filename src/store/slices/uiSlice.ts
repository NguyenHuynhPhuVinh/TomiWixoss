// src/store/slices/uiSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";

export interface UiSlice {
  isZoneViewerOpen: boolean;
  viewingLrigDeckForGrow: { forAssistIndex: number | null } | null;
  openZoneViewer: () => void;
  closeZoneViewer: () => void;
  openLrigDeckViewerForAssist: (zoneIndex: number) => void;
  closeLrigDeckViewer: () => void;
}

export const createUiSlice: StateCreator<GameStore, [], [], UiSlice> = (
  set
) => ({
  isZoneViewerOpen: false,
  viewingLrigDeckForGrow: null,

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
