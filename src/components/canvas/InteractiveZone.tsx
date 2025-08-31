// src/components/canvas/InteractiveZone.tsx
"use client";
// import { useStore } from "zustand";
// import useGameStore from "@/store/gameStore";
import { Plane } from "@react-three/drei";
import * as THREE from "three";
// import commandService from "@/logic/core/command.service";
// import { PlaceSigniCommand } from "@/logic/commands/placeSigni.command";
// import { ZoneComponent } from "@/logic/ecs/components/card.components";
import { dispatchPlaceSigniAction } from "@/logic/ecs/actions";
import { PlayerAction } from "@/store/types"; // Import type nếu cần

interface InteractiveZoneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  zoneIndex: number;
  playerAction: PlayerAction | null;
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

  console.log(
    `[InteractiveZone ${zoneIndex}] isSlotEmpty: ${isSlotEmpty}, isPlacingSigni: ${isPlacingSigni}, shouldHighlight: ${shouldHighlight}`
  );

  if (!shouldHighlight) return null;

  return (
    <Plane
      args={size}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (playerAction) {
          const entityId = parseInt(playerAction.cardUuid);
          dispatchPlaceSigniAction(entityId, zoneIndex);
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
