// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";

export default function GameController() {
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const startGame = useGameStore((state) => state.startGame);
  const goToNextPhase = useGameStore((state) => state.goToNextPhase);
  const drawCard = useGameStore((state) => state.drawCard);

  const renderContent = () => {
    switch (phase) {
      case "pre_game":
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chào mừng đến với TomiWixoss - Chế độ Sandbox.
            </p>
            <Button onClick={startGame} className="w-full">
              Bắt đầu Game
            </Button>
          </>
        );
      case "setup":
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Click vào Main Deck hoặc LRIG Deck để xem và chọn bài đặt.
            </p>
            <p className="text-sm text-muted-foreground">
              Sau đó click vào vùng trống trên sân để đặt bài.
            </p>
          </>
        );
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
            <Button onClick={goToNextPhase} className="w-full">
              Kết thúc Phase
            </Button>
          </>
        );
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border w-52 text-center pointer-events-auto">
      {renderContent()}
    </div>
  );
}
