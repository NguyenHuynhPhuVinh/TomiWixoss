// src/components/canvas/InteractiveZone.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { ZoneKey } from "@/types/game"; // Import type

interface InteractiveZoneProps {
  isOccupied: boolean; // <-- PROPS MỚI
  position: [number, number, number];
  size: [number, number]; // width, height
  zoneKey: ZoneKey;
  zoneIndex?: number;
}

export default function InteractiveZone({
  isOccupied,
  position,
  size,
  zoneKey,
  zoneIndex,
}: InteractiveZoneProps) {
  const playerAction = useGameStore((state) => state.playerAction);
  const moveCard = useGameStore((state) => state.moveCard);
  const setPlayerAction = useGameStore((state) => state.setPlayerAction);

  const canPlace = playerAction?.type.startsWith("place_") && !isOccupied;

  const handleClick = () => {
    console.log("--- Interactive Zone Clicked ---");
    console.log("Zone:", zoneKey, "Index:", zoneIndex);
    console.log("Is Occupied?", isOccupied);
    console.log("Current Player Action:", playerAction);
    console.log("Can Place?", canPlace);

    if (!canPlace || !playerAction) {
      console.log("Action prevented. Cannot place card here.");
      return;
    }

    console.log("Action allowed. Moving card:", playerAction.card.name);
    moveCard(playerAction.card.uuid, "hand", zoneKey, zoneIndex);

    setPlayerAction(null); // Hoàn thành hành động
  };

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial
        transparent
        opacity={0.3}
        color={isOccupied ? "red" : "green"}
        visible={!!playerAction?.type.startsWith("place_")}
      />
    </mesh>
  );
}
