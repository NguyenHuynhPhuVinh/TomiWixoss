// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CardInstance } from "@/types/game";
import Hand from "./Hand";
import SideCardPreview from "./SideCardPreview";
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
// Xóa DevPanel và các component phức tạp khác để tập trung
// const DevPanel = dynamic(() => import('@/components/ui/DevPanel'), { ssr: false });
const GameController = dynamic(() => import("@/components/ui/GameController"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  // Bật lại state và handler cho UI 2D
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  // Giả sử có action này trong store (sẽ thêm sau)
  const handleReturnSingleCard = (cardUuid: string) => {
    // TODO: Implement return single card action
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController />
        {/* Bật lại Hand và SideCardPreview */}
        <Hand
          onCardSelect={(card) => setSelectedCard(card)}
          onReturnSingleCard={handleReturnSingleCard}
        />
        <SideCardPreview card={selectedCard} />
      </div>

      <TomiwixossSceneLoader>
        {/* Tạm thời không cần click deck, chúng ta sẽ thêm lại sau */}
        <Scene />
      </TomiwixossSceneLoader>

      {/* Ẩn DeckViewer */}
      {/* {viewingDeck && ( ... )} */}
    </>
  );
}
