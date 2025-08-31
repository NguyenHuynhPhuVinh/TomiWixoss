// src/components/canvas/InteractiveZone.tsx
"use client";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { Plane } from "@react-three/drei";
import * as THREE from "three";

interface InteractiveZoneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  zoneIndex: number;
}

export default function InteractiveZone({
  position,
  rotation,
  size,
  zoneIndex,
}: InteractiveZoneProps) {
  const playerAction = useStore(useGameStore, (state) => state.playerAction);
  const signiZone = useStore(useGameStore, (state) => state.player.signiZone);
  const placeSigni = useStore(useGameStore, (state) => state.placeSigni);

  const isMySlotEmpty = signiZone[zoneIndex] === null;
  const isPlacingSigni = playerAction?.type === "place_signi";
  const shouldHighlight = isMySlotEmpty && isPlacingSigni;

  if (!shouldHighlight) return null; // Chỉ render khi cần

  return (
    <Plane
      args={size}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        placeSigni(zoneIndex);
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
