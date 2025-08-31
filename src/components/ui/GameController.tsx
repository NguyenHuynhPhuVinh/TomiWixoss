// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";

export default function GameController() {
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const startGame = useGameStore((state) => state.startGame);
  const confirmLrigSelection = useGameStore(
    (state) => state.confirmLrigSelection
  );
  const mulligan = useGameStore((state) => state.mulligan);
  const goToNextPhase = useGameStore((state) => state.goToNextPhase);
  const drawCard = useGameStore((state) => state.drawCard);

  const renderContent = () => {
    switch (phase) {
      case "pre_game":
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chào mừng đến với TomiWixoss.
            </p>
            <Button onClick={startGame} className="w-full">
              Bắt đầu Game
            </Button>
          </>
        );
      case "selecting_lrigs":
        return (
          <>
            <p className="text-muted-foreground mb-4">Chọn 3 LRIG Level 0.</p>
            {/* Tạm thời hard-code lựa chọn, sau này sẽ làm UI chọn */}
            <Button
              onClick={() => {
                confirmLrigSelection(
                  "WXDi-D01-001", // Center: At
                  "WXDi-D01-005", // Assist 1: Tawil
                  "WXDi-D01-008" // Assist 2: Umr
                );
              }}
              className="w-full"
            >
              Xác nhận LRIG
            </Button>
          </>
        );
      case "mulligan":
        // ... giữ nguyên logic mulligan ...
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chọn bài muốn đổi trên tay.
            </p>
            <Button
              onClick={() => mulligan([])} // Bỏ qua mulligan
              className="w-full"
            >
              Xác nhận (Bỏ qua)
            </Button>
          </>
        );
      // ... các case khác (draw, ener, main...) giữ nguyên ...
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
