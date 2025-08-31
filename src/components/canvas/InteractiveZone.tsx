// src/components/canvas/InteractiveZone.tsx
"use client";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { Plane } from "@react-three/drei";
import * as THREE from "three";
// import commandService from "@/logic/core/command.service";
// import { PlaceSigniCommand } from "@/logic/commands/placeSigni.command";
import { ZoneComponent } from "@/logic/ecs/components/card.components";

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
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);

  const signiInSlot = world?.query([ZoneComponent]).find((e) => {
    const zone = world.getComponent(e, ZoneComponent)!;
    return zone.zone === "signiZone" && zone.index === zoneIndex;
  });

  const isMySlotEmpty = !signiInSlot;
  const isPlacingSigni = playerAction?.type === "place_signi";
  const shouldHighlight = isMySlotEmpty && isPlacingSigni;

  if (!shouldHighlight) return null;

  return (
    <Plane
      args={size}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (playerAction) {
          // Tạm thời log ra, sẽ thay bằng System sau
          console.log(
            `TODO: Place card ${playerAction.cardUuid} in zone ${zoneIndex}`
          );
          useGameStore.getState().cancelPlayerAction();
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
