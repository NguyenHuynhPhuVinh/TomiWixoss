// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
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
  // Xóa tất cả các state và handler không cần thiết
  // const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  // ...

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController />
        {/* Tạm thời ẩn Hand và SideCardPreview */}
        {/* <Hand ... /> */}
        {/* <SideCardPreview card={selectedCard} /> */}
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
