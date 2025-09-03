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
  // Điều kiện để vùng này có thể được click
  const isActionActive = playerAction?.type === "place_signi" && isSlotEmpty;

  // Nếu không trong trạng thái đặt bài hoặc ô không trống, không render gì cả
  if (!isActionActive) {
    return null;
  }

  return (
    // Plane vẫn được render để bắt sự kiện raycast (click)
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
      {/* 
        Sử dụng một vật liệu cơ bản và đặt thuộc tính `visible` thành `false`.
        Điều này làm cho mặt phẳng hoàn toàn vô hình với người chơi,
        nhưng vẫn tồn tại trong scene để nhận sự kiện click.
      */}
      <meshBasicMaterial visible={false} />
    </Plane>
  );
}
