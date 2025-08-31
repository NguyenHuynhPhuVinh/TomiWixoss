// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";
import { CardInstance } from "@/types/game";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
const GameController = dynamic(() => import("@/components/ui/GameController"), {
  ssr: false,
});
const Hand = dynamic(() => import("@/components/ui/Hand"), {
  ssr: false,
});
const SideCardPreview = dynamic(
  () => import("@/components/ui/SideCardPreview"),
  {
    ssr: false,
  }
);
const GameLog = dynamic(() => import("@/components/ui/GameLog"), {
  ssr: false,
});
// const LrigSelector = dynamic(() => import("@/components/ui/LrigSelector"), {
//   ssr: false,
// });
// const DeckViewer = dynamic(() => import("@/components/ui/DeckViewer"), {
//   ssr: false,
// });

export default function ClientOnlyLoader() {
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [mulliganSelection, setMulliganSelection] = useState<string[]>([]);

  return (
    <>
      {/* Các component UI 2D nằm ở đây */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController />
        <Hand
          onCardSelect={setSelectedCard}
          onMulliganSelectionChange={setMulliganSelection}
        />
        <SideCardPreview card={selectedCard} />
        <GameLog />
      </div>

      {/*
        BỌC SCENE BẰNG LOADER:
        Điều này đảm bảo rằng tất cả các texture trong `allTexturePaths`
        sẽ được tải xong và cache lại TRƯỚC KHI <Scene> bắt đầu render.
      */}
      <TomiwixossSceneLoader>
        <Scene />
      </TomiwixossSceneLoader>

      {/* Các component Modal nằm ở đây - tạm thời comment out vì cần props phức tạp */}
      {/* <LrigSelector /> */}
      {/* <DeckViewer /> */}
    </>
  );
}
