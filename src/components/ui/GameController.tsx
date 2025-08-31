// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";
import gameManager from "@/logic/ecs/game.manager";

// Thêm props mới
interface GameControllerProps {
  selectedCardsForMulligan: string[];
}

export default function GameController({
  selectedCardsForMulligan,
}: GameControllerProps) {
  // Lấy state từ game model để đảm bảo luôn mới nhất
  const phase = useGameStore((state) => state.phase);
  const actionTakenInPhase = useGameStore((state) => state.actionTakenInPhase);

  const renderContent = () => {
    switch (phase) {
      case "pre_game":
        return (
          <Button
            onClick={() => {
              gameManager.createNewGame();
              // Cập nhật store để UI biết
              useGameStore.getState().setWorld(gameManager.world!);
              useGameStore.getState().setPhase("up"); // Tạm thời chuyển thẳng đến Up Phase
            }}
          >
            Chuẩn bị
          </Button>
        );
      case "up":
        return (
          <>
            <h3 className="font-bold">Up Phase</h3>
            <Button
              onClick={() => {
                // Thay vì gọi command, chúng ta chỉ cần chạy vòng lặp game
                gameManager.update();

                // Chúng ta cần một cách để trigger re-render sau khi update
                // Đây là một vấn đề cần giải quyết
              }}
              className="w-full mt-2"
            >
              Up All Cards
            </Button>
          </>
        );
      default:
        return (
          <>
            <h3 className="font-bold">{phase} Phase</h3>
            <Button
              onClick={() => {
                // Placeholder for other phases
              }}
              className="w-full mt-2"
            >
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
        <Button
          onClick={() => {
            gameManager.createNewGame();
            // Cập nhật store để UI biết
            useGameStore.getState().setWorld(gameManager.world!);
            useGameStore.getState().setPhase("up"); // Tạm thời chuyển thẳng đến Up Phase
          }}
          className="w-full"
          size="lg"
        >
          Chuẩn bị
        </Button>
      </div>
    );
  }

  // Khi game đã bắt đầu
  return (
    <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border w-56 text-center pointer-events-auto">
      {renderContent()}
    </div>
  );
}
