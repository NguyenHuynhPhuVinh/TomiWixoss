// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";
import { useStore } from "zustand";

// Thêm props mới
interface GameControllerProps {
  selectedCardsForMulligan: string[];
}

export default function GameController({
  selectedCardsForMulligan,
}: GameControllerProps) {
  const phase = useStore(useGameStore, (state) => state.phase);
  const prepareDecks = useStore(useGameStore, (state) => state.prepareDecks);
  const performMulligan = useStore(
    useGameStore,
    (state) => state.performMulligan
  );

  if (phase === "in_play") {
    // Khi game đã bắt đầu, ẩn controller này đi
    return null;
  }

  const renderContent = () => {
    switch (phase) {
      case "pre_game":
        return <Button onClick={prepareDecks}>Chuẩn bị</Button>;
      case "mulligan":
        const selectionCount = selectedCardsForMulligan.length;
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chọn các lá bài trên tay muốn đổi.
              <br />
              <span className="font-bold">Đã chọn: {selectionCount}</span>
            </p>
            <Button
              onClick={() => {
                // Gửi danh sách đã chọn vào action
                performMulligan(selectedCardsForMulligan);
              }}
              className="w-full"
            >
              Xác nhận đổi bài
            </Button>
          </>
        );
      default:
        return <p>Đang chuẩn bị...</p>;
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
      <h2 className="text-2xl font-bold mb-2 text-card-foreground">
        TomiWixoss
      </h2>
      <p className="text-muted-foreground mb-6">
        Sẵn sàng để bắt đầu một trận đấu.
      </p>
      {renderContent()}
    </div>
  );
}
