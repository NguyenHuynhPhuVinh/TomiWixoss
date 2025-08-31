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
  // --- LẤY ACTION MỚI TỪ STORE ---
  const goToNextPhase = useGameStore((state) => state.goToNextPhase);
  const drawCard = useGameStore((state) => state.drawCard);

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

      // Logic rút bài theo luật (lượt 1 rút 1, các lượt sau rút 2)
      case "draw":
        const amountToDraw = turn === 1 ? 1 : 2;
        return (
          <>
            <h3 className="text-lg font-bold">Turn {turn}</h3>
            <p className="text-muted-foreground mb-2">Draw Phase</p>
            <Button
              onClick={() => drawCard(amountToDraw)}
              className="w-full mb-2"
            >
              Rút {amountToDraw} lá
            </Button>
            <Button
              onClick={goToNextPhase}
              variant="outline"
              className="w-full"
            >
              Kết thúc Phase
            </Button>
          </>
        );

      default: // Các phase còn lại
        const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);
        return (
          <>
            <h3 className="text-lg font-bold">Turn {turn}</h3>
            <p className="text-muted-foreground mb-4">{phaseText} Phase</p>
            <Button
              onClick={goToNextPhase} // <-- KẾT NỐI ACTION VÀO ĐÂY
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
