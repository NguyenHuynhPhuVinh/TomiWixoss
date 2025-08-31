// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState, useMemo, useRef } from "react"; // Thêm useRef
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";
import { CardInstance } from "@/types/game";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import {
  CardInfoComponent,
  ZoneComponent,
  StatusComponent,
} from "@/logic/ecs/components/card.components";
import { dispatchConfirmLrigSelectionAction } from "@/logic/ecs/actions";
import { dispatchGrowLrigAction } from "@/logic/ecs/actions";
import { useEffect } from "react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside"; // <-- Import hook

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

export default function ClientOnlyLoader() {
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [mulliganSelection, setMulliganSelection] = useState<string[]>([]);

  // Lấy các state cần thiết từ store
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const phase = useStore(useGameStore, (state) => state.phase);
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
  const playerAction = useStore(useGameStore, (state) => state.playerAction);
  const cancelPlayerAction = useStore(
    useGameStore,
    (state) => state.cancelPlayerAction
  );

  // Khởi tạo game một lần khi component được mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const gameAreaRef = useRef<HTMLDivElement>(null); // <-- Tạo ref cho toàn bộ khu vực game

  // === SỬ DỤNG HOOK ĐỂ HỦY BỎ HÀNH ĐỘNG ===
  useOnClickOutside(gameAreaRef, () => {
    // Nếu đang có một hành động (như đặt bài) thì hủy nó đi
    if (playerAction) {
      console.log("Clicked outside, cancelling player action.");
      cancelPlayerAction();
    }
  });
  // =====================================

  // === TRUY VẤN DỮ LIỆU CHO LRIG SELECTOR ===
  const lrigDeckForSelector: CardInstance[] = useMemo(() => {
    if (!world) return [];

    // Tìm tất cả các entity trong lrigDeck
    const lrigEntities = world
      .query([CardInfoComponent, ZoneComponent])
      .filter((entity: number) => {
        const zone = world.getComponent(entity, ZoneComponent)!;
        return zone.zone === "lrigDeck";
      });

    // Chuyển đổi entity thành CardInstance mà LrigSelector có thể hiểu
    return lrigEntities.map((entity: number) => {
      const cardInfo = world.getComponent(entity, CardInfoComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;
      const zone = world.getComponent(entity, ZoneComponent)!;
      return {
        ...cardInfo.data,
        ...status,
        uuid: entity.toString(), // LrigSelector dùng uuid (string)
        owner: zone.owner,
      };
    });
  }, [world, worldVersion]);
  // ===========================================

  // === TRUY VẤN DỮ LIỆU CHO GROW OPTIONS ===
  const growOptions: CardInstance[] = useMemo(() => {
    if (!world) return [];

    const lrigDeckEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "lrigDeck");

    // --- LOGIC LỌC MỚI ---
    if (phase === "grow") {
      // Nếu là Grow Phase, LUÔN LỌC cho Center LRIG
      const centerLrigEntity = world.query([ZoneComponent]).find((e) => {
        const zone = world.getComponent(e, ZoneComponent)!;
        return zone.zone === "lrigZone" && zone.index === 1;
      });
      if (!centerLrigEntity) return [];
      const centerLrigInfo = world.getComponent(
        centerLrigEntity,
        CardInfoComponent
      )!;

      return lrigDeckEntities
        .filter((entity) => {
          const cardInfo = world.getComponent(entity, CardInfoComponent)!;
          return (
            cardInfo.data.level === (centerLrigInfo.data.level ?? -1) + 1 &&
            cardInfo.data.lrigType === centerLrigInfo.data.lrigType
          );
        })
        .map((entity) => {
          const cardInfo = world.getComponent(entity, CardInfoComponent)!;
          const status = world.getComponent(entity, StatusComponent)!;
          const zone = world.getComponent(entity, ZoneComponent)!;
          return {
            ...cardInfo.data,
            ...status,
            uuid: entity.toString(),
            owner: zone.owner,
          };
        });
    } else if (viewingLrigDeckForGrow) {
      // Nếu là các phase khác VÀ có yêu cầu xem Assist
      const assistIndex = viewingLrigDeckForGrow.forAssistIndex!;
      const assistLrigEntity = world.query([ZoneComponent]).find((e) => {
        const zone = world.getComponent(e, ZoneComponent)!;
        return zone.zone === "lrigZone" && zone.index === assistIndex;
      });
      if (!assistLrigEntity) return [];
      const assistLrigInfo = world.getComponent(
        assistLrigEntity,
        CardInfoComponent
      )!;

      return lrigDeckEntities
        .filter((entity) => {
          const cardInfo = world.getComponent(entity, CardInfoComponent)!;
          return (
            cardInfo.data.level === (assistLrigInfo.data.level ?? -1) + 1 &&
            cardInfo.data.lrigType === assistLrigInfo.data.lrigType
          );
        })
        .map((entity) => {
          const cardInfo = world.getComponent(entity, CardInfoComponent)!;
          const status = world.getComponent(entity, StatusComponent)!;
          const zone = world.getComponent(entity, ZoneComponent)!;
          return {
            ...cardInfo.data,
            ...status,
            uuid: entity.toString(),
            owner: zone.owner,
          };
        });
    }

    return []; // Mặc định không có lựa chọn nào
  }, [world, worldVersion, phase, viewingLrigDeckForGrow]);
  // ===========================================

  return (
    // Bọc toàn bộ game trong một div và gắn ref vào đó
    <div ref={gameAreaRef} className="w-screen h-screen">
      {/* Các component UI 2D nằm ở đây */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController />
        <Hand onCardSelect={setSelectedCard} />
        <SideCardPreview card={selectedCard} />
        <GameLog />
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
        isOpen={phase === "selecting_lrigs"}
        fullLrigDeck={lrigDeckForSelector}
        onConfirm={(centerUuid, assist1Uuid, assist2Uuid) => {
          // Chuyển đổi uuid (string) lại thành entityId (number) để dispatch
          const centerId = parseInt(centerUuid);
          const assistIds = [parseInt(assist1Uuid), parseInt(assist2Uuid)];
          dispatchConfirmLrigSelectionAction(centerId, assistIds);
        }}
      />
      <DeckViewer
        title={
          viewingLrigDeckForGrow
            ? "Chọn Assist LRIG để Grow"
            : "Chọn Center LRIG để Grow"
        }
        cards={growOptions}
        isOpen={isZoneViewerOpen}
        onOpenChange={closeZoneViewer}
        onCardClick={(card) => {
          const targetEntityId = parseInt(card.uuid);
          // Xác định zoneIndex dựa trên phase hoặc viewingLrigDeckForGrow
          const zoneIndex =
            phase === "grow"
              ? 1 // Luôn là Center nếu ở Grow Phase
              : viewingLrigDeckForGrow!.forAssistIndex!;
          dispatchGrowLrigAction(targetEntityId, zoneIndex);
        }}
      />
    </div>
  );
}
