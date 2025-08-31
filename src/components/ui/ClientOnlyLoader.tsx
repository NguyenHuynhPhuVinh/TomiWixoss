// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CardInstance } from "@/types/game";
import Hand from "./Hand";
import CardPreview from "./CardPreview";
import useGameStore from "@/store/gameStore";
// IMPORT LOADER MỚI
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";

// Dynamic import cho các component nặng
const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
const DevPanel = dynamic(() => import("@/components/ui/DevPanel"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  const [previewCard, setPreviewCard] = useState<CardInstance | null>(null);

  // Lấy các action từ store
  const drawCardAction = useGameStore((state) => state.drawCard);
  const returnCardsAction = useGameStore(
    (state) => state.returnAllCardsFromHand
  );

  const handleDeckClick = () => {
    // Mỗi lần click là rút 1 lá
    drawCardAction(1);
  };

  return (
    <>
      {/* DevPanel có thể nằm ngoài vì nó không phụ thuộc vào tài nguyên 3D */}
      <DevPanel />

      {/* BỌC TOÀN BỘ SCENE VÀO TRONG LOADER MỚI */}
      <TomiwixossSceneLoader>
        <Scene onDeckClick={handleDeckClick} />
      </TomiwixossSceneLoader>

      {/* Giao diện 2D */}
      <Hand
        onCardClick={(card) => setPreviewCard(card)}
        onReturnCards={returnCardsAction}
      />
      <CardPreview
        card={previewCard}
        onOpenChange={(isOpen) => !isOpen && setPreviewCard(null)}
      />
    </>
  );
}
