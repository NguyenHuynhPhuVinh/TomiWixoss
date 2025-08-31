// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";
import { useStore } from "zustand";
import commandService from "@/logic/core/command.service";
import { DrawCardCommand } from "@/logic/commands/drawCard.command";
import { AdvancePhaseCommand } from "@/logic/commands/advancePhase.command";
import { UpAllCardsCommand } from "@/logic/commands/upAllCards.command";
import setupService from "@/logic/core/setup.service";

// Thêm props mới
interface GameControllerProps {
  selectedCardsForMulligan: string[];
}

export default function GameController({
  selectedCardsForMulligan,
}: GameControllerProps) {
  // Lấy state từ game model để đảm bảo luôn mới nhất
  const game = useStore(useGameStore, (state) => state.game);
  const phase = game?.phase ?? "pre_game"; // Nếu game chưa có thì là pre_game
  const turn = game?.turn ?? 0;
  const mainDeckCount = game?.player.mainDeck.length ?? 0;
  const actionTakenInPhase = game?.actionTakenInPhase ?? false;

  const renderContent = () => {
    // Xử lý trạng thái hành động đặc biệt trước
    // if (playerAction?.type === "place_signi") {
    //   return (
    //     <>
    //       <p className="text-sm text-blue-400 mb-2">
    //         Chọn một ô SIGNI trống trên sân...
    //       </p>
    //       <Button onClick={cancelPlayerAction} variant="destructive" size="sm">
    //         Hủy
    //       </Button>
    //     </>
    //   );
    // }

    switch (phase) {
      case "pre_game":
        return (
          <Button onClick={() => setupService.startSetup()}>Chuẩn bị</Button>
        );
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
                // === KẾT NỐI HÀM VÀO ĐÂY ===
                setupService.confirmMulligan(selectedCardsForMulligan);
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
            <Button
              onClick={() => {
                const command = new UpAllCardsCommand();
                commandService.dispatch(command);
              }}
              className="w-full mt-2"
            >
              Up All Cards
            </Button>
            <Button
              onClick={() => {
                const command = new AdvancePhaseCommand();
                commandService.dispatch(command);
              }}
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
              onClick={() => {
                const command = new DrawCardCommand();
                commandService.dispatch(command);
              }}
              className="w-full mt-2"
              disabled={!canDraw} // Kiểm tra điều kiện trực tiếp
            >
              {actionTakenInPhase ? "Đã rút bài" : `Rút ${amountToDraw} lá`}
            </Button>
            <Button
              onClick={() => {
                const command = new AdvancePhaseCommand();
                commandService.dispatch(command);
              }}
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
                {/* === THAY ĐỔI VĂN BẢN HƯỚNG DẪN === */}
                Tùy chọn: Chọn một lá bài trên tay hoặc trên sân để nạp vào Ener
                Zone.
              </p>
            )}
            <Button
              onClick={() => {
                const command = new AdvancePhaseCommand();
                commandService.dispatch(command);
              }}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );
      case "grow":
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Grow Phase</h3>
            {actionTakenInPhase ? (
              <p className="text-sm text-green-500 my-2">Đã Grow.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground my-2">
                  Tùy chọn: Click vào LRIG Deck để xem các lựa chọn Grow.
                </p>
                {/* Nút này chỉ để mở viewer, hành động chính là click vào lá bài trong viewer */}
                <Button
                  onClick={() => useGameStore.getState().openZoneViewer()} // Sửa lại để gọi action từ store
                  className="w-full mt-2"
                  variant="secondary"
                >
                  Xem LRIG Deck
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                const command = new AdvancePhaseCommand();
                commandService.dispatch(command);
              }}
              className="w-full mt-2"
            >
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
              {/* {mustDiscard && (
                <p className="text-destructive text-sm my-2">
                  Tay bạn có {handSize} lá.
                  <br />
                  Hãy bỏ {handSize - 6} lá.
                </p>
              )} */}
              <Button
                onClick={() => {
                  const command = new AdvancePhaseCommand();
                  commandService.dispatch(command);
                }}
                className="w-full mt-2"
                // disabled={mustDiscard} // <-- Vô hiệu hóa nút khi buộc phải bỏ bài
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
            <Button
              onClick={() => {
                const command = new AdvancePhaseCommand();
                commandService.dispatch(command);
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
          onClick={() => setupService.startSetup()}
          className="w-full"
          size="lg"
        >
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
