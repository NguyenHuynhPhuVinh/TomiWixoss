// src/store/slices/uiSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
// === THÊM IMPORT MỚI ===
import {
  initiatePlayerAction,
  cancelPlayerActionInECS,
} from "@/logic/actions.miniplex";
import { CardInstance } from "@/types/game"; // Thêm import này

// export type PlayerAction = {
//   type: "place_signi";
//   cardUuid: string; // Thực ra đây là Entity ID dạng string
// };

export interface UiSlice {
  // playerAction: GameStore["playerAction"]; // <-- XÓA
  isZoneViewerOpen: GameStore["isZoneViewerOpen"];
  viewingLrigDeckForGrow: GameStore["viewingLrigDeckForGrow"];
  mustDiscard: GameStore["mustDiscard"];
  setMustDiscard: GameStore["setMustDiscard"];

  // State cho card preview chung
  previewedCard: CardInstance | null;
  setPreviewedCard: (card: CardInstance | null) => void;

  // State cho context menu trong thế giới 3D
  isWorldContextMenuOpen: boolean;
  worldContextMenuPosition: { x: number; y: number };
  worldContextMenuOptions: { label: string; action: () => void }[];

  // Actions cho context menu
  openWorldContextMenu: (
    position: { x: number; y: number },
    options: { label: string; action: () => void }[]
  ) => void;
  closeWorldContextMenu: () => void;

  initiatePlaceSigni: (cardUuid: string) => void; // <-- THAY ĐỔI
  cancelPlayerAction: () => void; // <-- THAY ĐỔI
  openZoneViewer: GameStore["openZoneViewer"];
  closeZoneViewer: GameStore["closeZoneViewer"];
  openLrigDeckViewerForAssist: GameStore["openLrigDeckViewerForAssist"];
}

export const createUiSlice: StateCreator<GameStore, [], [], UiSlice> = (
  set,
  get
) => ({
  // playerAction: null, // <-- XÓA
  isZoneViewerOpen: false,
  viewingLrigDeckForGrow: null,
  mustDiscard: false,
  previewedCard: null,
  isWorldContextMenuOpen: false,
  worldContextMenuPosition: { x: 0, y: 0 },
  worldContextMenuOptions: [],

  setPreviewedCard: (card) => set({ previewedCard: card }),

  openWorldContextMenu: (position, options) =>
    set({
      isWorldContextMenuOpen: true,
      worldContextMenuPosition: position,
      worldContextMenuOptions: options,
    }),

  closeWorldContextMenu: () =>
    set({ isWorldContextMenuOpen: false, worldContextMenuOptions: [] }),

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
