// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react"; // Thêm useMemo
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

  // Khởi tạo game một lần khi component được mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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

    let currentLrigEntity: number | undefined;
    let zoneIndex: number;

    if (viewingLrigDeckForGrow) {
      // Grow Assist LRIG
      zoneIndex = viewingLrigDeckForGrow.forAssistIndex!;
      currentLrigEntity = world.query([ZoneComponent]).find((e) => {
        const zone = world.getComponent(e, ZoneComponent)!;
        return zone.zone === "lrigZone" && zone.index === zoneIndex;
      });
    } else {
      // Grow Center LRIG
      zoneIndex = 1;
      currentLrigEntity = world.query([ZoneComponent]).find((e) => {
        const zone = world.getComponent(e, ZoneComponent)!;
        return zone.zone === "lrigZone" && zone.index === zoneIndex;
      });
    }

    if (!currentLrigEntity) return [];
    const currentLrigInfo = world.getComponent(
      currentLrigEntity,
      CardInfoComponent
    )!;

    const lrigDeckEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "lrigDeck");

    return lrigDeckEntities
      .filter((entity) => {
        const cardInfo = world.getComponent(entity, CardInfoComponent)!;
        // Logic kiểm tra Grow
        return (
          cardInfo.data.level === (currentLrigInfo.data.level ?? -1) + 1 &&
          cardInfo.data.lrigType === currentLrigInfo.data.lrigType
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
  }, [world, worldVersion, phase, viewingLrigDeckForGrow]);
  // ===========================================

  return (
    <>
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

      {/* Các component Modal nằm ở đây - tạm thời comment out vì cần props phức tạp */}
      {/* === BỎ COMMENT VÀ CẬP NHẬT LRIG SELECTOR === */}
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
      {/* =========================================== */}
      <DeckViewer
        title={
          viewingLrigDeckForGrow
            ? "Chọn Assist LRIG để Grow"
            : "Chọn Center LRIG để Grow"
        }
        cards={growOptions}
        isOpen={isZoneViewerOpen}
        onOpenChange={() => {}} // Có thể để trống hoặc thêm logic
        onCardClick={(card) => {
          const targetEntityId = parseInt(card.uuid);
          // Xác định zoneIndex dựa trên phase hoặc viewingLrigDeckForGrow
          const zoneIndex = viewingLrigDeckForGrow
            ? viewingLrigDeckForGrow.forAssistIndex!
            : 1; // Mặc định là Center LRIG
          dispatchGrowLrigAction(targetEntityId, zoneIndex);
        }}
      />
      {/* <DeckViewer /> */}
    </>
  );
}
