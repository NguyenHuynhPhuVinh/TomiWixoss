// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CardInstance } from "@/types/game";
import Hand from "./Hand";
// Bỏ CardPreview cũ, dùng SideCardPreview mới
import SideCardPreview from "./SideCardPreview";
import DeckViewer from "./DeckViewer";
import useGameStore from "@/store/gameStore";
import { TomiwixossSceneLoader } from "./TomiwixossSceneLoader";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
const DevPanel = dynamic(() => import("@/components/ui/DevPanel"), {
  ssr: false,
});
const GameController = dynamic(() => import("@/components/ui/GameController"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  // State này bây giờ sẽ điều khiển SideCardPreview
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [viewingDeck, setViewingDeck] = useState<{
    title: string;
    cards: CardInstance[];
  } | null>(null);

  // Lấy các action từ store
  const drawCardAction = useGameStore((state) => state.drawCard);
  const returnSingleCardAction = useGameStore(
    (state) => state.returnSingleCardFromHand
  );
  const mainDeck = useGameStore((state) => state.player.mainDeck);
  const lrigDeck = useGameStore((state) => state.player.lrigDeck);
  const setPlayerAction = useGameStore((state) => state.setPlayerAction);

  const handleMainDeckClick = () => {
    console.log("handleMainDeckClick triggered!"); // <-- LOG 1
    console.log("Main Deck has", mainDeck.length, "cards."); // <-- LOG 2
    setViewingDeck({ title: "Main Deck", cards: mainDeck });
  };

  const handleLrigDeckClick = () => {
    console.log("handleLrigDeckClick triggered!"); // <-- LOG 1 for LRIG
    console.log("LRIG Deck has", lrigDeck.length, "cards."); // <-- LOG 2 for LRIG
    setViewingDeck({ title: "LRIG Deck", cards: lrigDeck });
  };

  const handleSelectCardFromDeck = (card: CardInstance) => {
    // Tùy thuộc vào loại bài, set hành động tương ứng
    if (card.type === "SIGNI") {
      setPlayerAction({ type: "place_signi", card });
    } else if (card.type === "LRIG") {
      setPlayerAction({ type: "place_lrig", card });
    }
    setViewingDeck(null); // Đóng viewer
  };

  return (
    <>
      {/*
        Container cho toàn bộ UI 2D.
        Nó sẽ không bắt sự kiện chuột, cho phép click "xuyên qua" nó.
      */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        {/*
          Các component con bên trong sẽ tự bật lại pointer-events
          nếu chúng cần tương tác.
        */}
        <DevPanel />
        <GameController />
        <Hand
          onCardSelect={(card) => setSelectedCard(card)}
          onReturnSingleCard={returnSingleCardAction}
        />
        <SideCardPreview card={selectedCard} />
      </div>

      {/* Canvas 3D nằm ở lớp dưới (z-index thấp hơn) */}
      <TomiwixossSceneLoader>
        <Scene
          onMainDeckClick={handleMainDeckClick}
          onLrigDeckClick={handleLrigDeckClick}
        />
      </TomiwixossSceneLoader>

      {/* DeckViewer modal - cần pointer-events để có thể tương tác */}
      {viewingDeck && (
        <div className="pointer-events-auto">
          <DeckViewer
            title={viewingDeck.title}
            cards={viewingDeck.cards}
            isOpen={!!viewingDeck}
            onOpenChange={() => setViewingDeck(null)}
            onCardClick={handleSelectCardFromDeck}
          />
        </div>
      )}
    </>
  );
}
