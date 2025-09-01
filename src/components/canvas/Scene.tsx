// src/components/canvas/Scene.tsx
"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Preload,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card";
import InteractiveZone from "./InteractiveZone";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { P1_ZONE_COORDINATES, CARD_DIMENSIONS } from "@/data/zoneCoordinates";
import { CardInstance } from "@/types/game";

// --- THAY ĐỔI LỚN ---
import { world } from "@/logic/ecs/world.miniplex";
import { Entity } from "@/logic/ecs/types.miniplex";
import { chargeEnerAction } from "@/logic/actions.miniplex";
// import { openLrigDeckViewerForAssistAction } from "@/logic/actions.miniplex"; // Sẽ tạo action này sau

export default function Scene() {
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const phase = useStore(useGameStore, (state) => state.phase);
  const actionTakenInPhase = useStore(
    useGameStore,
    (state) => state.actionTakenInPhase
  );
  const playerAction = useStore(useGameStore, (state) => state.playerAction); // <-- LẤY playerAction Ở ĐÂY
  const cancelPlayerAction = useStore(
    useGameStore,
    (state) => state.cancelPlayerAction
  ); // <-- LẤY cancelPlayerAction
  const openLrigDeckViewerForAssist = useStore(
    useGameStore,
    (state) => state.openLrigDeckViewerForAssist
  ); // <-- LẤY openLrigDeckViewerForAssist

  const boardState = useStore(useGameStore, (state) => state.boardState); // Lấy boardState riêng

  const coords = P1_ZONE_COORDINATES;

  if (!world) {
    // Render một GameBoard trống nếu world chưa được tạo
    const boardWidth = 12;
    const boardHeight = boardWidth / (4962 / 3509);
    return (
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 18, 0.1]} fov={60} />
        <OrbitControls minDistance={5} maxDistance={25} />
        <Environment preset="city" />
        <ambientLight intensity={1} />
        <GameBoard
          position={[0, 0, boardHeight / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <GameBoard
          position={[0, 0, -(boardHeight / 2)]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
        />
      </Canvas>
    );
  }

  // === TRUY VẤN DỮ LIỆU (VIẾT LẠI) ===
  const renderableEntities = useMemo(() => {
    return world.with("cardInfo", "zone", "status");
  }, [worldVersion]); // Re-query khi world thay đổi

  // Nhóm các entity theo zone để tính toán xếp chồng
  const entitiesByZone = new Map<string, Entity[]>();
  for (const entity of renderableEntities) {
    const zoneName = entity.zone.zone;
    if (!entitiesByZone.has(zoneName)) {
      entitiesByZone.set(zoneName, []);
    }
    entitiesByZone.get(zoneName)!.push(entity);
  }

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 18, 0.1]} fov={60} />
      <OrbitControls minDistance={5} maxDistance={25} />
      <Environment preset="city" />
      <ambientLight intensity={1} />

      {/* --- BÀN ĐẤU --- */}
      <GameBoard
        position={[0, 0, 12 / (4962 / 3509) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <GameBoard
        position={[0, 0, -(12 / (4962 / 3509) / 2)]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />

      {/* --- RENDER CÁC LÁ BÀI TỪ MINIPLEX WORLD --- */}
      {renderableEntities.map((entity: Entity) => {
        // Thêm type cho entity
        // Truy cập trực tiếp, không dùng getComponent
        const { cardInfo, status, zone } = entity;

        // Bỏ qua các lá bài không có đủ component để render
        if (!cardInfo || !status || !zone) return null;

        const cardInstance: CardInstance = {
          ...cardInfo.data,
          ...status,
          uuid: entity.uuid,
          owner: zone.owner,
        };

        // --- LOGIC TÍNH TOÁN VỊ TRÍ VÀ XOAY BÀI ---
        let position: [number, number, number] = [0, 0, 0];
        let rotation: [number, number, number] = [-Math.PI / 2, 0, 0];

        const zoneName = zone.zone;
        const index = zone.index;
        const totalCardsInZone = entitiesByZone.get(zoneName)?.length ?? 1;

        switch (zoneName) {
          case "mainDeck":
          case "trash":
            position = [
              coords.MAIN_DECK.x,
              coords.MAIN_DECK.y + index * CARD_DIMENSIONS.thickness,
              coords.MAIN_DECK.z,
            ];
            if (zoneName === "trash") {
              position[0] = coords.TRASH.x;
              position[2] = coords.TRASH.z;
            }
            break;

          case "lrigDeck":
          case "lrigTrash":
            position = [
              coords.LRIG_DECK.x,
              coords.LRIG_DECK.y + index * CARD_DIMENSIONS.thickness,
              coords.LRIG_DECK.z,
            ];
            rotation = [
              -Math.PI / 2,
              0,
              cardInfo.data.type === "PIECE" ? 0 : Math.PI / 2,
            ];
            if (zoneName === "lrigTrash") {
              position[0] = coords.LRIG_TRASH.x;
              position[2] = coords.LRIG_TRASH.z;
            }
            break;

          case "lrigZone":
            const lrigCoords = [
              coords.ASSIST_LRIG_1,
              coords.CENTER_LRIG,
              coords.ASSIST_LRIG_2,
            ][index];
            position = [lrigCoords.x, lrigCoords.y, lrigCoords.z];
            break;

          case "signiZone":
            const signiCoords = [
              coords.SIGNI_1,
              coords.SIGNI_2,
              coords.SIGNI_3,
            ][index];
            position = [signiCoords.x, signiCoords.y, signiCoords.z];
            break;

          case "lifeCloth":
            position = [
              coords.LIFE_CLOTH.x + index * 0.67,
              coords.LIFE_CLOTH.y + index * CARD_DIMENSIONS.thickness,
              coords.LIFE_CLOTH.z,
            ];
            rotation = [-Math.PI / 2, 0, Math.PI / 2];
            break;

          case "enerZone":
            // Sử dụng lại logic xếp chồng đẹp của bạn
            const zoneEntities = entitiesByZone.get("enerZone")!;
            const realIndex = zoneEntities.findIndex((e) => e === entity);
            position = [
              coords.ENER_ZONE.x,
              coords.ENER_ZONE.y +
                (totalCardsInZone - 1 - realIndex) * CARD_DIMENSIONS.thickness,
              coords.ENER_ZONE.z + realIndex * 0.7,
            ];
            rotation = [-Math.PI / 2, 0, Math.PI];
            break;

          // Bỏ qua 'hand' vì nó được render bởi UI 2D
          case "hand":
            return null;

          default:
            return null;
        }

        return (
          <Card
            key={entity.uuid}
            card={cardInstance}
            position={position}
            rotation={rotation}
            onClick={() => {
              if (
                zone.zone === "signiZone" &&
                phase === "ener" &&
                !actionTakenInPhase
              ) {
                chargeEnerAction(entity.uuid); // Gọi action mới
              }
              // ... các logic click khác ...
            }}
          />
        );
      })}

      {/* THÊM VÙNG TƯƠNG TÁC CHO SIGNI ZONE */}
      {[coords.SIGNI_1, coords.SIGNI_2, coords.SIGNI_3].map(
        (signiCoords, index) => (
          <InteractiveZone
            key={`interactive-signi-${index}`}
            position={[signiCoords.x, signiCoords.y, signiCoords.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            size={[2, 2]}
            zoneIndex={index}
            // === TRUYỀN PROPS XUỐNG ===
            playerAction={playerAction}
            isSlotEmpty={boardState.player.signiZone[index] === null}
            cancelPlayerAction={cancelPlayerAction}
          />
        )
      )}

      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
