// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";

export default function GameController() {
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const setupDecks = useGameStore((state) => state.setupDecks);
  const dealInitialCards = useGameStore((state) => state.dealInitialCards);
  const mulligan = useGameStore((state) => state.mulligan);

  const renderContent = () => {
    switch (phase) {
      case "setup":
        return (
          <>
            <p className="text-muted-foreground mb-4">Sẵn sàng để bắt đầu.</p>
            <Button
              onClick={() => {
                setupDecks();
                dealInitialCards();
              }}
              className="w-full"
            >
              Bắt đầu Game
            </Button>
          </>
        );
      case "mulligan":
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chọn bài muốn đổi trên tay, sau đó bấm xác nhận.
            </p>
            <Button
              onClick={() => {
                // Tạm thời, chúng ta sẽ không đổi bài để đơn giản
                mulligan([]);
              }}
              className="w-full"
            >
              Xác nhận Mulligan (Bỏ qua)
            </Button>
          </>
        );
      default: // Các phase trong game
        const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);
        return (
          <>
            <h3 className="text-lg font-bold text-card-foreground">
              Turn {turn}
            </h3>
            <p className="text-muted-foreground mb-4">{phaseText} Phase</p>
            <Button
              // onClick={goToNextPhase} // Sẽ thêm action này sau
              className="w-full"
            >
              Kết thúc Phase
            </Button>
          </>
        );
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border w-52 text-center">
      {renderContent()}
    </div>
  );
}
