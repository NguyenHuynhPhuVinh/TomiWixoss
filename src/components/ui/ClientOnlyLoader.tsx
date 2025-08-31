// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CardInstance } from "@/types/game";
import Hand from "./Hand";
import SideCardPreview from "./SideCardPreview";
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";
import LrigSelector from "./LrigSelector"; // Import component mới
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import DeckViewer from "./DeckViewer"; // Đảm bảo đã import
import GameLog from "./GameLog"; // <-- IMPORT COMPONENT MỚI
import "@/logic/effects/effect.system"; // Chỉ cần import là đủ để khởi tạo

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
// Xóa DevPanel và các component phức tạp khác để tập trung
// const DevPanel = dynamic(() => import('@/components/ui/DevPanel'), { ssr: false });
const GameController = dynamic(() => import("@/components/ui/GameController"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  // Bật lại state và handler cho UI 2D
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  // State mới để lưu các lá bài được chọn cho mulligan
  const [mulliganSelection, setMulliganSelection] = useState<string[]>([]);

  const phase = useStore(useGameStore, (state) => state.phase);
  const fullLrigDeck = useStore(useGameStore, (state) => state.player.lrigDeck);
  const dealRemainingSetup = useStore(
    useGameStore,
    (state) => state.dealRemainingSetup
  );

  const isZoneViewerOpen = useStore(
    useGameStore,
    (state) => state.isZoneViewerOpen
  );
  const closeZoneViewer = useStore(
    useGameStore,
    (state) => state.closeZoneViewer
  );
  const lrigDeck = useStore(useGameStore, (state) => state.player.lrigDeck);
  const currentCenterLrig = useStore(
    useGameStore,
    (state) => state.player.lrigZone[1]
  );
  const growCenterLrig = useStore(
    useGameStore,
    (state) => state.growCenterLrig
  );
  const viewingLrigDeckForGrow = useStore(
    useGameStore,
    (state) => state.viewingLrigDeckForGrow
  );
  const closeLrigDeckViewer = useStore(
    useGameStore,
    (state) => state.closeLrigDeckViewer
  );
  const lrigZone = useStore(useGameStore, (state) => state.player.lrigZone);
  const growAssistLrig = useStore(
    useGameStore,
    (state) => state.growAssistLrig
  );

  // Lọc ra các lựa chọn Grow hợp lệ
  const growOptions = (() => {
    // Grow cho Center LRIG (logic cũ)
    if (phase === "grow") {
      return lrigDeck.filter(
        (card) =>
          currentCenterLrig &&
          card.level === (currentCenterLrig.level ?? -1) + 1 &&
          card.lrigType === currentCenterLrig.lrigType
      );
    }
    // Grow cho Assist LRIG (logic mới)
    if (
      viewingLrigDeckForGrow?.forAssistIndex !== null &&
      viewingLrigDeckForGrow?.forAssistIndex !== undefined
    ) {
      const assistIndex = viewingLrigDeckForGrow.forAssistIndex;
      const currentAssist = lrigZone[assistIndex];
      const currentCenter = lrigZone[1];
      if (!currentAssist || !currentCenter) return [];

      return lrigDeck.filter((card) => {
        const requiredTimings = card.abilities?.find(
          (a) => a.type === "Enter"
        )?.timing;
        const timingOk = requiredTimings
          ? requiredTimings.includes(phase as any)
          : true; // Nếu ko ghi timing thì mặc định là được

        return (
          timingOk &&
          card.level === (currentAssist.level ?? -1) + 1 &&
          card.lrigType === currentAssist.lrigType &&
          card.level <= (currentCenter.level ?? 0)
        );
      });
    }
    return lrigDeck; // Mặc định hiển thị tất cả
  })();

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController
          // Truyền danh sách đã chọn vào GameController
          selectedCardsForMulligan={mulliganSelection}
        />
        {/* Bật lại Hand và SideCardPreview */}
        <Hand
          onCardSelect={(card) => setSelectedCard(card)}
          // Nhận danh sách từ Hand và cập nhật state
          onMulliganSelectionChange={setMulliganSelection}
        />
        <SideCardPreview card={selectedCard} />

        {/* === THÊM GAMELOG VÀO ĐÂY === */}
        <GameLog />
        {/* ============================= */}
      </div>

      <TomiwixossSceneLoader>
        {/* Tạm thời không cần click deck, chúng ta sẽ thêm lại sau */}
        <Scene />
      </TomiwixossSceneLoader>

      <LrigSelector
        isOpen={phase === "selecting_lrigs"}
        fullLrigDeck={fullLrigDeck}
        onConfirm={dealRemainingSetup}
      />

      <DeckViewer
        title={
          viewingLrigDeckForGrow
            ? "Chọn Assist LRIG để Grow"
            : "LRIG Deck - Chọn để Grow"
        }
        cards={growOptions}
        isOpen={isZoneViewerOpen}
        onOpenChange={closeLrigDeckViewer}
        onCardClick={(card) => {
          if (phase === "grow") {
            growCenterLrig(card.uuid);
          } else if (
            viewingLrigDeckForGrow?.forAssistIndex !== null &&
            viewingLrigDeckForGrow?.forAssistIndex !== undefined
          ) {
            growAssistLrig(card.uuid, viewingLrigDeckForGrow.forAssistIndex);
          }
        }}
      />

      {/* Ẩn DeckViewer */}
      {/* {viewingDeck && ( ... )} */}
    </>
  );
}
