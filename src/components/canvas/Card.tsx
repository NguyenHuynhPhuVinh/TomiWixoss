// src/components/canvas/Card.tsx
"use client";
import { CardInstance } from "@/types/game";
import CardModel from "./CardModel";
import { memo, useMemo } from "react"; // <-- Add useMemo
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { world } from "@/logic/ecs/world.miniplex"; // <-- Import world

interface CardProps {
  uuid: string; // <-- Only pass uuid
  position: [number, number, number];
  rotation: [number, number, number];
  onClick: (uuid: string) => void; // <-- Pass uuid to onClick
}

// 2. BỌC COMPONENT BẰNG memo()
const Card = memo(function Card({
  uuid,
  position,
  rotation,
  onClick,
}: CardProps) {
  // Fetch entity data based on uuid
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const entity = useMemo(() => {
    return Array.from(world.entities).find((e) => e.uuid === uuid);
  }, [uuid, worldVersion]);

  if (!entity || !entity.cardInfo || !entity.status) return null;

  const cardInstance: CardInstance = {
    ...entity.cardInfo.data,
    ...entity.status,
    uuid: entity.uuid,
    owner: entity.zone?.owner || "player",
  };

  // Logic bên trong không đổi
  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(uuid);
      }}
    >
      <CardModel card={cardInstance} />
    </group>
  );
});

export default Card;
