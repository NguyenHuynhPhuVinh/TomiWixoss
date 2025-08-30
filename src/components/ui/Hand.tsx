// src/components/ui/Hand.tsx
"use client";

import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import Image from "next/image";
import { CardInstance } from "@/types/game";
import { Button } from "./button";

interface HandProps {
  onCardClick: (card: CardInstance) => void;
  onReturnCards: () => void;
}

export default function Hand({ onCardClick, onReturnCards }: HandProps) {
  const hand = useStore(useGameStore, (state) => state.player.hand);

  if (hand.length === 0) {
    return null; // Ẩn component nếu không có bài trên tay
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col items-center z-20">
      <div className="flex justify-center items-end space-x-[-40px] h-[140px] mb-4">
        {hand.map((card, index) => (
          <div
            key={card.uuid}
            className="relative w-[100px] h-[140px] cursor-pointer transition-transform duration-300 hover:-translate-y-4 hover:z-10"
            onClick={() => onCardClick(card)}
          >
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              className="object-contain"
            />
          </div>
        ))}
      </div>
      <Button onClick={onReturnCards} variant="destructive">
        Bỏ bài
      </Button>
    </div>
  );
}
