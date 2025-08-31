// src/components/canvas/Scene.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import { P1_ZONE_COORDINATES } from "@/data/zoneCoordinates";
import {
  CardInfoComponent,
  ZoneComponent,
  StatusComponent,
} from "@/logic/ecs/components/card.components";
import { Entity } from "@/logic/ecs/ecs.types";

export default function Scene() {
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const coords = P1_ZONE_COORDINATES;

  if (!world) return null; // Không render gì nếu chưa có world

  // Tạo một hàm helper để render một zone
  const renderZone = (zoneName: string) => {
    const entitiesInZone = world
      .query([ZoneComponent])
      .filter(
        (e: Entity) => world.getComponent(e, ZoneComponent)!.zone === zoneName
      );

    return entitiesInZone.map((entity: Entity) => {
      const cardInfo = world.getComponent(entity, CardInfoComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;
      const zoneInfo = world.getComponent(entity, ZoneComponent)!;

      // Logic để tính toán position, rotation dựa trên zoneInfo
      // Tạm thời hard-code cho mainDeck
      const position: [number, number, number] = [
        coords.MAIN_DECK.x,
        coords.MAIN_DECK.y,
        coords.MAIN_DECK.z,
      ];
      const rotation: [number, number, number] = [-Math.PI / 2, 0, 0];

      const cardInstance = {
        ...cardInfo.data,
        ...status,
        uuid: entity.toString(),
        owner: zoneInfo.owner, // <-- Lấy owner từ ZoneComponent
      };

      return (
        <Card
          key={entity}
          card={cardInstance}
          position={position}
          rotation={rotation}
        />
      );
    });
  };

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 18, 0.1]} fov={60} />
      <OrbitControls minDistance={5} maxDistance={25} />

      <Environment preset="city" />
      <ambientLight intensity={1} />
      <directionalLight position={[0, 20, 10]} intensity={1.5} castShadow />

      <GameBoard position={[0, 0, 0.5]} rotation={[-Math.PI / 2, 0, 0]} />
      <GameBoard
        position={[0, 0, -0.5]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />

      {renderZone("mainDeck")}
      {/* Tạm thời chỉ render mainDeck */}
    </Canvas>
  );
}
