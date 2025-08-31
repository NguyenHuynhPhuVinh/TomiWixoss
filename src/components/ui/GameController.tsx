// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { Button } from "./button";
import gameManager from "@/logic/ecs/game.manager";
import { GamePhase } from "@/types/game";
import { GlobalStateComponent } from "@/logic/ecs/components/card.components";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";
import {
  dispatchAdvancePhaseAction,
  dispatchConfirmMulliganAction,
} from "@/logic/ecs/actions"; // <-- IMPORT ACTION MỚI

export default function GameController() {
  const phase = useStore(useGameStore, (state) => state.phase);
  const turn = useStore(useGameStore, (state) => state.turn);
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const actionTakenInPhase = useStore(
    useGameStore,
    (state) => state.actionTakenInPhase
  );
  const initializeGame = useGameStore((state) => state.initializeGame);
  // const setPhase = useGameStore((state) => state.setPhase); // Không còn cần thiết

  const globalState = world?.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
  const mulliganSelectionCount = globalState?.mulliganSelection.length ?? 0;

  // Xóa hàm handleNextPhase cũ
  // const handleNextPhase = () => { ... };

  const renderContent = () => {
    switch (phase) {
      case "pre_game":
        return <Button onClick={initializeGame}>Chuẩn bị</Button>;

      case "up":
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Up Phase</h3>
            <Button
              onClick={() => gameManager.forceUpdate()}
              className="w-full mt-2"
            >
              Up All Cards
            </Button>
            {/* Sử dụng action dispatcher mới */}
            <Button
              onClick={dispatchAdvancePhaseAction}
              variant="outline"
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );

      case "draw":
        const amountToDraw = turn === 1 ? 1 : 2;
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Draw Phase</h3>
            <Button
              onClick={() => gameManager.forceUpdate()}
              className="w-full mt-2"
              disabled={actionTakenInPhase}
            >
              {actionTakenInPhase ? "Đã rút bài" : `Rút ${amountToDraw} lá`}
            </Button>
            <Button
              onClick={dispatchAdvancePhaseAction}
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
                Chọn một lá bài trên tay hoặc trên sân để nạp Ener.
              </p>
            )}
            <Button
              onClick={dispatchAdvancePhaseAction}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );

      case "mulligan":
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chọn các lá bài trên tay muốn đổi.
              <br />
              <span className="font-bold">
                Đã chọn: {mulliganSelectionCount}
              </span>
            </p>
            <Button onClick={dispatchConfirmMulliganAction} className="w-full">
              Xác nhận đổi bài
            </Button>
          </>
        );

      // Tạm thời các phase khác chỉ có nút Next
      default:
        const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);
        return (
          <>
            <h3 className="font-bold">
              Turn {turn} - {phaseText} Phase
            </h3>
            <Button
              onClick={dispatchAdvancePhaseAction}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );
    }
  };

  // ... JSX render controller ...
  if (phase === "pre_game") {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">
          TomiWixoss
        </h2>
        <p className="text-muted-foreground mb-6">
          Sẵn sàng để bắt đầu một trận đấu.
        </p>
        <Button onClick={initializeGame} className="w-full" size="lg">
          Chuẩn bị
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border w-56 text-center pointer-events-auto">
      {renderContent()}
    </div>
  );
}
