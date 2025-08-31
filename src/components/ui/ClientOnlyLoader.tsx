// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CardInstance } from "@/types/game";
import Hand from "./Hand";
// Bỏ CardPreview cũ, dùng SideCardPreview mới
import SideCardPreview from "./SideCardPreview";
import useGameStore from "@/store/gameStore";
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
const DevPanel = dynamic(() => import("@/components/ui/DevPanel"), {
  ssr: false,
});
const PhaseIndicator = dynamic(() => import("@/components/ui/PhaseIndicator"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  // State này bây giờ sẽ điều khiển SideCardPreview
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);

  // Lấy các action từ store
  const drawCardAction = useGameStore((state) => state.drawCard);
  const returnSingleCardAction = useGameStore(
    (state) => state.returnSingleCardFromHand
  );

  const handleDeckClick = () => {
    // Mỗi lần click là rút 1 lá
    drawCardAction(1);
  };

  return (
    <>
      <DevPanel />
      <PhaseIndicator />

      <TomiwixossSceneLoader>
        <Scene onDeckClick={handleDeckClick} />
      </TomiwixossSceneLoader>

      {/* Giao diện 2D */}
      <Hand
        onCardSelect={(card) => setSelectedCard(card)} // Cập nhật state khi bài được chọn
        onReturnSingleCard={returnSingleCardAction} // Truyền action bỏ bài vào
      />
      <SideCardPreview card={selectedCard} />
    </>
  );
}
