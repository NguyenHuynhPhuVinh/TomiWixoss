// src/components/canvas/InteractiveZone.tsx
"use client";
// import { useStore } from "zustand";
// import useGameStore from "@/store/gameStore";
import { Plane } from "@react-three/drei";
import * as THREE from "three";
// import commandService from "@/logic/core/command.service";
// import { PlaceSigniCommand } from "@/logic/commands/placeSigni.command";
// import { ZoneComponent } from "@/logic/ecs/components/card.components";
import { placeSigniAction } from "@/logic/actions.miniplex";
import { PlayerActionPayload } from "@/logic/ecs/types.miniplex"; // Import type từ types.miniplex

interface InteractiveZoneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  zoneIndex: number;
  playerAction: PlayerActionPayload | null;
  isSlotEmpty: boolean;
  cancelPlayerAction: () => void;
}

export default function InteractiveZone({
  position,
  rotation,
  size,
  zoneIndex,
  playerAction,
  isSlotEmpty,
  cancelPlayerAction,
}: InteractiveZoneProps) {
  // Logic tính toán giờ chỉ dựa vào props
  const isPlacingSigni = playerAction?.type === "place_signi";
  const shouldHighlight = isSlotEmpty && isPlacingSigni;

  if (!shouldHighlight) return null;

  return (
    <Plane
      args={size}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (playerAction) {
          placeSigniAction(playerAction.cardUuid, zoneIndex);
          cancelPlayerAction();
        }
      }}
    >
      <meshStandardMaterial
        color="#00ff00"
        opacity={0.3}
        transparent
        side={THREE.DoubleSide}
      />
    </Plane>
  );
}
