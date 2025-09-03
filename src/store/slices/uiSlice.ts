// src/store/slices/uiSlice.ts
import { StateCreator } from "zustand";
import { GameStore } from "../types";
// === THÊM IMPORT MỚI ===
import {
  initiatePlayerAction,
  cancelPlayerActionInECS,
} from "@/logic/actions.miniplex";
import { CardInstance } from "@/types/game"; // Thêm import này
import { Zone } from "@/logic/constants"; // <-- Thêm import
import { world } from "@/logic/ecs/world.miniplex"; // <-- Thêm import
import { Entity } from "@/logic/ecs/types.miniplex"; // <-- Thêm import

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

  // State mới để quản lý việc xem zone
  viewingZone: Zone | null;
  viewingZoneCards: CardInstance[];
  openZoneForViewing: (zone: Zone) => void; // Action mới

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
  viewingZone: null,
  viewingZoneCards: [],

  setPreviewedCard: (card) => set({ previewedCard: card }),

  openWorldContextMenu: (position, options) =>
    set({
      isWorldContextMenuOpen: true,
      worldContextMenuPosition: position,
      worldContextMenuOptions: options,
    }),

  closeWorldContextMenu: () =>
    set({ isWorldContextMenuOpen: false, worldContextMenuOptions: [] }),

  // Action mới để mở viewer và xem bài
  openZoneForViewing: (zone) => {
    const zoneEntities = world
      .with("cardInfo", "status", "zone", "uuid")
      .where((e) => e.zone.zone === zone);

    const cards = Array.from(zoneEntities)
      .sort((a, b) => (b.zone?.index ?? 0) - (a.zone?.index ?? 0)) // Sắp xếp để lá mới nhất lên đầu
      .map(
        (e: Entity): CardInstance => ({
          ...e.cardInfo!.data,
          ...e.status!,
          uuid: e.uuid,
          owner: e.zone!.owner,
        })
      );

    set({
      isZoneViewerOpen: true,
      viewingZone: zone,
      viewingZoneCards: cards,
      viewingLrigDeckForGrow: null, // Đảm bảo chế độ grow được tắt
    });
  },

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
      viewingZone: null, // Reset state xem zone
      viewingZoneCards: [], // Xóa danh sách bài
      previewedCard: null, // <-- THÊM DÒNG NÀY ĐỂ RESET PREVIEW
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
