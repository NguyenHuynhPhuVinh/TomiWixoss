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
  const mustDiscard = useStore(useGameStore, (state) => state.mustDiscard);
  const handSize = useStore(useGameStore, (state) => state.player.hand.length);
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
  const mainDeckCount = useStore(
    useGameStore,
    (state) => state.player.mainDeck.length
  );
  // --- LẤY STATE MỚI ---
  const actionTakenInPhase = useStore(
    useGameStore,
    (state) => state.actionTakenInPhase
  );

  const renderContent = () => {
    switch (phase) {
      case "pre_game":
        return <Button onClick={prepareDecks}>Chuẩn bị</Button>;
      case "selecting_lrigs":
        return (
          <p className="text-muted-foreground animate-pulse">
            Vui lòng chọn LRIG...
          </p>
        );
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
        const amountToDraw = turn === 1 ? 1 : 2;
        // Điều kiện mới: có bài trong deck VÀ chưa thực hiện hành động
        const canDraw = mainDeckCount > 0 && !actionTakenInPhase;
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Draw Phase</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Deck: {mainDeckCount} lá
            </p>
            <Button
              onClick={drawCardForTurn}
              className="w-full mt-2"
              disabled={!canDraw} // <-- Điều kiện vô hiệu hóa giờ đã thông minh hơn
            >
              {actionTakenInPhase ? "Đã rút bài" : `Rút ${amountToDraw} lá`}
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
      case "ener":
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Ener Phase</h3>
            {actionTakenInPhase ? (
              <p className="text-sm text-green-500 my-2">Đã nạp Ener.</p>
            ) : (
              <p className="text-sm text-muted-foreground my-2">
                Tùy chọn: Chọn một lá bài trên tay để nạp vào Ener Zone.
              </p>
            )}
            <Button onClick={goToNextPhase} className="w-full mt-2">
              Next Phase
            </Button>
          </>
        );
      default: // Các phase còn lại (ener, main, ...)
        const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);
        if (phase === "end") {
          return (
            <>
              <h3 className="font-bold">Turn {turn} - End Phase</h3>
              {mustDiscard && (
                <p className="text-destructive text-sm my-2">
                  Tay bạn có {handSize} lá.
                  <br />
                  Hãy bỏ {handSize - 6} lá.
                </p>
              )}
              <Button
                onClick={goToNextPhase}
                className="w-full mt-2"
                disabled={mustDiscard} // <-- Vô hiệu hóa nút khi buộc phải bỏ bài
              >
                Kết thúc Lượt
              </Button>
            </>
          );
        }
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
