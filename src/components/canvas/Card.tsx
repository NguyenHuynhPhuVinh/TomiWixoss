// src/components/canvas/Card.tsx
"use client";
import { CardInstance } from "@/types/game";
import CardModel from "./CardModel";
import { memo } from "react"; // <-- 1. IMPORT memo

interface CardProps {
  card: CardInstance;
  position: [number, number, number];
  rotation: [number, number, number];
  onClick?: () => void;
}

// 2. BỌC COMPONENT BẰNG memo()
const Card = memo(function Card({
  card,
  position,
  rotation,
  onClick,
}: CardProps) {
  // Logic bên trong không đổi
  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <CardModel card={card} />
    </group>
  );
});

export default Card;
