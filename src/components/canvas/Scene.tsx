// src/components/canvas/Scene.tsx
"use client";

import { Suspense, useMemo, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Preload,
  Stats,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card";
import InteractiveZone from "./InteractiveZone";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { P1_ZONE_COORDINATES, CARD_DIMENSIONS } from "@/data/zoneCoordinates";
import { CardInstance } from "@/types/game";
import {
  world as miniplexWorld,
  globalEntity,
} from "@/logic/ecs/world.miniplex";
import { Entity } from "@/logic/ecs/types.miniplex";
import { chargeEnerAction } from "@/logic/actions.miniplex";
import { getValidGrowOptions } from "@/logic/ecs/selectors.miniplex";
import { useWorldQuery } from "@/hooks/useWorldQuery";
import { GamePhase, Zone } from "@/logic/constants";
import { cancelPlayerActionInECS } from "@/logic/actions.miniplex";

function SceneContent() {
  const { invalidate } = useThree();
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const phase = globalEntity.globalState?.phase;
  const actionTakenInPhase = globalEntity.globalState?.actionTakenInPhase;
  const playerAction = globalEntity.globalState?.playerAction;
  const openLrigDeckViewerForAssist = useStore(
    useGameStore,
    (state) => state.openLrigDeckViewerForAssist
  );
  const addLog = useStore(useGameStore, (state) => state.addLog);
  const coords = P1_ZONE_COORDINATES;
  useEffect(() => {
    invalidate();
  }, [worldVersion, invalidate]);
  const renderableEntities = useWorldQuery(() =>
    Array.from(miniplexWorld.with("cardInfo", "zone", "status"))
  );
  const handleCardClick = useCallback(
    (entityUuid: string) => {
      const entity = renderableEntities.find((e) => e.uuid === entityUuid);
      if (!entity) return;

      const { zone } = entity;
      if (!zone) return;
      if (
        zone.zone === Zone.SIGNI_ZONE &&
        phase === GamePhase.ENER &&
        !actionTakenInPhase
      ) {
        chargeEnerAction(entityUuid);
      }
      const isAssistLrig =
        zone.zone === Zone.LRIG_ZONE && (zone.index === 0 || zone.index === 2);
      const canTryGrowAssist =
        isAssistLrig &&
        phase &&
        [GamePhase.MAIN, GamePhase.ATTACK].includes(phase as any);
      if (canTryGrowAssist) {
        const options = getValidGrowOptions(phase, zone.index);
        if (options.length > 0) {
          openLrigDeckViewerForAssist(zone.index);
        } else {
          addLog({ key: "logs.noGrowOptions", type: "info" });
        }
      }
    },
    [
      phase,
      actionTakenInPhase,
      openLrigDeckViewerForAssist,
      addLog,
      renderableEntities,
    ]
  );
  const entitiesByZone = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const entity of renderableEntities) {
      const zoneName = entity.zone!.zone;
      if (!map.has(zoneName)) {
        map.set(zoneName, []);
      }
      map.get(zoneName)!.push(entity);
    }
    return map;
  }, [renderableEntities]);

  return (
    <>
      {/* <--- THIẾT LẬP CAMERA TỰ DO VÀ GIỚI HẠN GÓC NHÌN ---> */}
      <PerspectiveCamera makeDefault position={[0, 12, 18]} fov={50} />
      <OrbitControls
        enableRotate={true} /* MỞ KHÓA XOAY CAMERA */
        enablePan={true}
        panSpeed={0.8}
        minDistance={5} /* Cho phép zoom gần hơn */
        maxDistance={40} /* Cho phép zoom xa hơn */
        /* Giới hạn góc nhìn, ngăn không cho camera đi xuống dưới mặt bàn */
        maxPolarAngle={Math.PI / 2 - 0.05}
      />

      <Environment preset="sunset" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <Stats />

      {/* 
        BỎ GROUP XOAY ĐI, SÂN ĐẤU SẼ TRỞ LẠI NẰM NGANG BÌNH THƯỜNG
        VÌ GIỜ CAMERA CÓ THỂ XOAY TỰ DO
      */}

      {/* --- BÀN ĐẤU --- */}
      <GameBoard
        position={[0, 0, 12 / (4962 / 3509) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <GameBoard
        position={[0, 0, -(12 / (4962 / 3509) / 2)]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />

      {/* --- RENDER CÁC LÁ BÀI --- */}
      {renderableEntities.map((entity: Entity) => {
        // ... (phần còn lại của logic render bài không đổi) ...
        const { cardInfo, status, zone } = entity;
        if (!cardInfo || !status || !zone) return null;

        let position: [number, number, number] = [0, 0, 0];
        let rotation: [number, number, number] = [-Math.PI / 2, 0, 0];
        const zoneName = zone.zone;
        const index = zone.index;
        switch (zoneName) {
          case Zone.MAIN_DECK:
            position = [
              coords.MAIN_DECK.x,
              coords.MAIN_DECK.y + index * CARD_DIMENSIONS.thickness,
              coords.MAIN_DECK.z,
            ];
            break;

          // Tách riêng TRASH ra khỏi MAIN_DECK và thêm logic mới
          case Zone.TRASH: {
            // Lấy trực tiếp index đã được gán từ logic game
            const stackIndex = zone.index;

            // Tính toán vị trí Y dựa trên stackIndex để xếp chồng chính xác
            // Lá có index cao hơn (mới hơn) sẽ có vị trí Y cao hơn (nằm trên)
            position = [
              coords.TRASH.x,
              coords.TRASH.y + stackIndex * CARD_DIMENSIONS.thickness,
              coords.TRASH.z,
            ];
            break;
          }

          case Zone.LRIG_DECK:
          case Zone.LRIG_TRASH:
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
            if (zoneName === Zone.LRIG_TRASH) {
              position[0] = coords.LRIG_TRASH.x;
              position[2] = coords.LRIG_TRASH.z;
            }
            break;
          case Zone.LRIG_ZONE:
            const lrigCoords = [
              coords.ASSIST_LRIG_1,
              coords.CENTER_LRIG,
              coords.ASSIST_LRIG_2,
            ][index];
            position = [lrigCoords.x, lrigCoords.y, lrigCoords.z];
            break;
          case Zone.SIGNI_ZONE:
            const signiCoords = [
              coords.SIGNI_1,
              coords.SIGNI_2,
              coords.SIGNI_3,
            ][index];
            position = [signiCoords.x, signiCoords.y, signiCoords.z];
            break;
          case Zone.LIFE_CLOTH:
            position = [
              coords.LIFE_CLOTH.x + index * 0.67,
              coords.LIFE_CLOTH.y + index * CARD_DIMENSIONS.thickness,
              coords.LIFE_CLOTH.z,
            ];
            rotation = [-Math.PI / 2, 0, Math.PI / 2];
            break;
          case Zone.ENER_ZONE: {
            const zoneEntities = entitiesByZone.get(Zone.ENER_ZONE);
            if (!zoneEntities) return null;
            const realIndex = zoneEntities.findIndex((e) => e === entity);
            if (realIndex === -1) return null;
            position = [
              coords.ENER_ZONE.x,
              coords.ENER_ZONE.y +
                (zoneEntities.length - 1 - realIndex) *
                  CARD_DIMENSIONS.thickness,
              coords.ENER_ZONE.z + realIndex * 0.7,
            ];
            rotation = [-Math.PI / 2, 0, Math.PI];
            break;
          }
          case Zone.HAND:
            return null;
          default:
            return null;
        }
        return (
          <Card
            key={entity.uuid}
            uuid={entity.uuid}
            position={position}
            rotation={rotation}
            onClick={handleCardClick}
          />
        );
      })}

      {/* VÙNG TƯƠNG TÁC CHO SIGNI ZONE */}
      {[coords.SIGNI_1, coords.SIGNI_2, coords.SIGNI_3].map(
        (signiCoords, index) => {
          const isSlotEmpty = !renderableEntities.some(
            (entity) =>
              entity.zone?.zone === Zone.SIGNI_ZONE &&
              entity.zone?.index === index
          );
          return (
            <InteractiveZone
              key={`interactive-signi-${index}`}
              position={[signiCoords.x, signiCoords.y, signiCoords.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              size={[2, 2]}
              zoneIndex={index}
              playerAction={playerAction || null}
              isSlotEmpty={isSlotEmpty}
              cancelPlayerAction={cancelPlayerActionInECS}
            />
          );
        }
      )}
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      frameloop="demand"
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <color attach="background" args={["#1c1917"]} />
      <Suspense fallback={null}>
        <SceneContent />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
