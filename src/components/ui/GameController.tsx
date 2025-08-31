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
  const turn = useStore(useGameStore, (state) => state.turn);
  const prepareDecks = useStore(useGameStore, (state) => state.prepareDecks);
  const performMulligan = useStore(
    useGameStore,
    (state) => state.performMulligan
  );
  const goToNextPhase = useStore(useGameStore, (state) => state.goToNextPhase);
  const upAllCards = useStore(useGameStore, (state) => state.upAllCards);
  const drawCardForTurn = useStore(
    useGameStore,
    (state) => state.drawCardForTurn
  );

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
      case "up":
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Up Phase</h3>
            <Button onClick={upAllCards} className="w-full mt-2">
              Up All Cards
            </Button>
            <Button
              onClick={goToNextPhase}
              variant="outline"
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );
      case "draw":
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Draw Phase</h3>
            <Button onClick={drawCardForTurn} className="w-full mt-2">
              Draw Card(s)
            </Button>
            <Button
              onClick={goToNextPhase}
              variant="outline"
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );
      default: // Các phase còn lại (ener, main, ...)
        const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);
        return (
          <>
            <h3 className="font-bold">
              Turn {turn} - {phaseText} Phase
            </h3>
            <Button onClick={goToNextPhase} className="w-full mt-2">
              Next Phase
            </Button>
          </>
        );
    }
  };

  if (phase === "pre_game") {
    // Khi ở phase pre_game, vẫn giữ ở giữa để thu hút sự chú ý
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">
          TomiWixoss
        </h2>
        <p className="text-muted-foreground mb-6">
          Sẵn sàng để bắt đầu một trận đấu.
        </p>
        <Button onClick={prepareDecks} className="w-full" size="lg">
          Chuẩn bị
        </Button>
      </div>
    );
  }

  // Khi game đã bắt đầu (mulligan hoặc các phase trong lượt)
  return (
    <div
      // === THAY ĐỔI Ở ĐÂY ===
      // Thay vì căn giữa, chúng ta sẽ đặt nó ở góc trên bên phải
      className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border w-56 text-center pointer-events-auto"
    >
      {renderContent()}
    </div>
  );
}
