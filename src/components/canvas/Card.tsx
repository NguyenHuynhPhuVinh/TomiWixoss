// src/components/canvas/Card.tsx
"use client";
import { CardInstance } from "@/types/game";
import CardModel from "./CardModel";

interface CardProps {
  card: CardInstance;
  position: [number, number, number];
  rotation: [number, number, number];
  onClick?: () => void;
}

export default function Card({ card, position, rotation, onClick }: CardProps) {
  // Logic phức tạp đã được chuyển vào CardModel
  // Component này giờ chỉ lo về vị trí và tương tác
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
}
