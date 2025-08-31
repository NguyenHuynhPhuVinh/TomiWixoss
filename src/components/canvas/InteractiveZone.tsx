// src/components/canvas/InteractiveZone.tsx
"use client";
import useGameStore from "@/store/gameStore";

interface InteractiveZoneProps {
  position: [number, number, number];
  size: [number, number]; // width, height
  zoneKey: string;
  zoneIndex?: number;
}

export default function InteractiveZone({
  position,
  size,
  zoneKey,
  zoneIndex,
}: InteractiveZoneProps) {
  const playerAction = useGameStore((state) => state.playerAction);
  const moveCard = useGameStore((state) => state.moveCard);
  const setPlayerAction = useGameStore((state) => state.setPlayerAction);

  const handleClick = () => {
    console.log(`InteractiveZone clicked: ${zoneKey} ${zoneIndex}`);
    console.log("Current playerAction:", playerAction);

    if (playerAction?.type.startsWith("place_")) {
      // Logic di chuyển bài sẽ được thêm vào đây
      console.log(
        `Clicked on ${zoneKey} ${zoneIndex} while trying to place a card.`
      );

      if (
        playerAction.type === "place_signi" &&
        zoneKey === "signiZone" &&
        zoneIndex !== undefined
      ) {
        console.log("Moving SIGNI card to signiZone", zoneIndex);
        moveCard(playerAction.card.uuid, "mainDeck", zoneKey, zoneIndex);
      } else if (
        playerAction.type === "place_lrig" &&
        zoneKey === "lrigZone" &&
        zoneIndex !== undefined
      ) {
        console.log("Moving LRIG card to lrigZone", zoneIndex);
        moveCard(playerAction.card.uuid, "lrigDeck", zoneKey, zoneIndex);
      }

      setPlayerAction(null); // Hoàn thành hành động
    } else {
      console.log("No playerAction set, ignoring click");
    }
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
        opacity={0.2}
        color="green"
        visible={!!playerAction}
      />
    </mesh>
  );
}
