// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState, useMemo, useRef, useEffect } from "react";
import { CardInstance } from "@/types/game";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

// --- THAY ĐỔI LỚN ---
import { world, globalEntity } from "@/logic/ecs/world.miniplex";
import { Entity } from "@/logic/ecs/types.miniplex";
import { getValidGrowOptions } from "@/logic/ecs/selectors.miniplex";
import { startGameLoop } from "@/logic/game.engine.miniplex";
import {
  confirmLrigSelectionAction,
  growLrigAction,
  cancelPlayerActionInECS,
} from "@/logic/actions.miniplex";

import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";
import { bootstrapGame } from "@/logic/engine.setup"; // <-- IMPORT MỚI
// === THAY ĐỔI: Import constants ===
import { GamePhase, Zone } from "@/logic/constants";

// --- CHẠY BOOTSTRAP NGAY LẬP TỨC KHI FILE NÀY ĐƯỢC LOAD ---
// Điều này đảm bảo nó chỉ chạy một lần duy nhất phía client.
if (typeof window !== "undefined") {
  bootstrapGame();
}

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
const GameController = dynamic(() => import("@/components/ui/GameController"), {
  ssr: false,
});
const Hand = dynamic(() => import("@/components/ui/Hand"), {
  ssr: false,
});
const SideCardPreview = dynamic(
  () => import("@/components/ui/SideCardPreview"),
  {
    ssr: false,
  }
);
const GameLog = dynamic(() => import("@/components/ui/GameLog"), {
  ssr: false,
});
const LrigSelector = dynamic(() => import("@/components/ui/LrigSelector"), {
  ssr: false,
});
const DeckViewer = dynamic(() => import("@/components/ui/DeckViewer"), {
  ssr: false,
});
const LanguageSwitcher = dynamic(
  () => import("@/components/ui/LanguageSwitcher"),
  {
    ssr: false,
  }
);

export default function ClientOnlyLoader() {
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [mulliganSelection, setMulliganSelection] = useState<string[]>([]);

  // Lấy các state cần thiết từ store
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  // === THAY ĐỔI: Lấy phase từ globalEntity ===
  const phase = globalEntity.globalState?.phase;
  const isZoneViewerOpen = useStore(
    useGameStore,
    (state) => state.isZoneViewerOpen
  );
  const viewingLrigDeckForGrow = useStore(
    useGameStore,
    (state) => state.viewingLrigDeckForGrow
  );
  const initializeGame = useStore(
    useGameStore,
    (state) => state.initializeGame
  );
  const closeZoneViewer = useStore(
    useGameStore,
    (state) => state.closeZoneViewer
  );
  const playerAction = globalEntity.globalState?.playerAction; // <-- ĐỌC TỪ ĐÂY
  // const cancelPlayerAction = useStore( // <-- KHÔNG CẦN NỮA
  //   useGameStore,
  //   (state) => state.cancelPlayerAction
  // );

  // Khởi tạo game và vòng lặp
  useEffect(() => {
    // Hàm này chỉ chạy một lần khi component mount
    const init = async () => {
      // 2. Nạp dữ liệu deck vào game
      initializeGame();
    };

    init();
  }, [initializeGame]); // Dependency vẫn là initializeGame

  const gameAreaRef = useRef<HTMLDivElement>(null); // <-- Tạo ref cho toàn bộ khu vực game

  // === SỬ DỤNG HOOK ĐỂ HỦY BỎ HÀNH ĐỘNG ===
  useOnClickOutside(gameAreaRef, () => {
    // Nếu đang có một hành động (như đặt bài) thì hủy nó đi
    if (playerAction) {
      console.log("Clicked outside, cancelling player action.");
      cancelPlayerActionInECS();
    }
  });
  // =====================================

  // === TRUY VẤN DỮ LIỆU CHO LRIG SELECTOR (VIẾT LẠI) ===
  const lrigDeckForSelector: CardInstance[] = useMemo(() => {
    // THÊM ĐIỀU KIỆN BẢO VỆ
    if (!world) return [];

    const lrigEntities = [];
    for (const entity of world.with("cardInfo", "status", "zone")) {
      if (entity.zone?.zone === Zone.LRIG_DECK) {
        // <-- Sử dụng hằng số
        lrigEntities.push(entity);
      }
    }

    return lrigEntities.map(
      (entity: Entity): CardInstance => ({
        ...entity.cardInfo!.data,
        ...entity.status!,
        uuid: entity.uuid,
        owner: entity.zone!.owner,
      })
    );
  }, [world, useStore(useGameStore, (s) => s.worldVersion)]); // Thêm world vào dependency array

  // === TRUY VẤN DỮ LIỆU CHO GROW OPTIONS (VIẾT LẠI) ===
  const growOptions: CardInstance[] = useMemo(() => {
    // THÊM ĐIỀU KIỆN BẢO VỆ
    if (!world || !phase) return [];

    let zoneIndex: number;
    if (phase === GamePhase.GROW) zoneIndex = 1; // <-- Sử dụng hằng số
    else if (viewingLrigDeckForGrow)
      zoneIndex = viewingLrigDeckForGrow.forAssistIndex!;
    else return [];

    const validGrowEntities = getValidGrowOptions(phase, zoneIndex);

    return validGrowEntities.map(
      (entity: Entity): CardInstance => ({
        ...entity.cardInfo!.data,
        ...entity.status!,
        uuid: entity.uuid,
        owner: entity.zone!.owner,
      })
    );
  }, [
    world, // Thêm world vào dependency array
    phase,
    viewingLrigDeckForGrow,
    useStore(useGameStore, (s) => s.worldVersion),
  ]);

  return (
    // Bọc toàn bộ game trong một div và gắn ref vào đó
    <div ref={gameAreaRef} className="w-screen h-screen">
      {/* Các component UI 2D nằm ở đây */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController />
        <Hand onCardSelect={setSelectedCard} />
        <SideCardPreview card={selectedCard} />
        <GameLog />
        <LanguageSwitcher />
      </div>

      {/*
        BỌC SCENE BẰNG LOADER:
        Điều này đảm bảo rằng tất cả các texture trong `allTexturePaths`
        sẽ được tải xong và cache lại TRƯỚC KHI <Scene> bắt đầu render.
      */}
      <TomiwixossSceneLoader>
        <Scene />
      </TomiwixossSceneLoader>

      <LrigSelector
        isOpen={phase === GamePhase.SELECTING_LRIGS} // <-- Sử dụng hằng số
        fullLrigDeck={lrigDeckForSelector}
        onConfirm={(centerUuid, assist1Uuid, assist2Uuid) => {
          // Gọi action mới
          confirmLrigSelectionAction(centerUuid, [assist1Uuid, assist2Uuid]);
        }}
      />
      <DeckViewer
        context={viewingLrigDeckForGrow ? "assist_grow" : "center_grow"}
        cards={growOptions}
        isOpen={isZoneViewerOpen}
        onOpenChange={closeZoneViewer}
        onCardClick={(card) => {
          const zoneIndex =
            phase === GamePhase.GROW
              ? 1
              : viewingLrigDeckForGrow!.forAssistIndex!;
          growLrigAction(card.uuid, zoneIndex);
        }}
      />
    </div>
  );
}
