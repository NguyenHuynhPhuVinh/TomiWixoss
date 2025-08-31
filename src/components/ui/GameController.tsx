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
import { ZoneComponent } from "@/logic/ecs/components/card.components"; // <-- IMPORT
import {
  dispatchAdvancePhaseAction,
  dispatchConfirmMulliganAction,
} from "@/logic/ecs/actions"; // <-- IMPORT ACTION MỚI
import { dispatchStartSetupAction } from "@/logic/ecs/actions";

export default function GameController() {
  const phase = useStore(useGameStore, (state) => state.phase);
  const turn = useStore(useGameStore, (state) => state.turn);
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);
  const actionTakenInPhase = useStore(
    useGameStore,
    (state) => state.actionTakenInPhase
  );
  const mustDiscard = useStore(useGameStore, (state) => state.mustDiscard);
  const initializeGame = useGameStore((state) => state.initializeGame);
  const openZoneViewer = useGameStore((state) => state.openZoneViewer);
  const playerAction = useStore(useGameStore, (state) => state.playerAction);
  const cancelPlayerAction = useStore(
    useGameStore,
    (state) => state.cancelPlayerAction
  );
  // const setPhase = useGameStore((state) => state.setPhase); // Không còn cần thiết

  const globalState = world?.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
  const mulliganSelectionCount = globalState?.mulliganSelection.length ?? 0;

  // Xóa hàm handleNextPhase cũ
  // const handleNextPhase = () => { ... };

  const renderContent = () => {
    // === XỬ LÝ TRẠNG THÁI HÀNH ĐỘNG ĐẶC BIỆT TRƯỚC ===
    if (playerAction?.type === "place_signi") {
      return (
        <>
          <p className="text-sm text-blue-400 mb-2 animate-pulse">
            Chọn một ô SIGNI trống trên sân...
          </p>
          <Button
            onClick={cancelPlayerAction}
            variant="destructive"
            size="sm"
            className="w-full mt-2"
          >
            Hủy
          </Button>
        </>
      );
    }
    // ===============================================

    switch (phase) {
      case "pre_game":
        // Nút này bây giờ sẽ dispatch action
        return <Button onClick={dispatchStartSetupAction}>Chuẩn bị</Button>;

      case "selecting_lrigs":
        // Giao diện này bây giờ sẽ được hiển thị đúng
        return (
          <p className="text-muted-foreground animate-pulse">
            Vui lòng chọn LRIG...
          </p>
        );

      case "up":
      case "draw":
        const phaseTextAuto = phase.charAt(0).toUpperCase() + phase.slice(1);
        return (
          <>
            <h3 className="font-bold">
              Turn {turn} - {phaseTextAuto} Phase
            </h3>
            <p className="text-muted-foreground animate-pulse mt-4">
              Đang tự động thực hiện...
            </p>
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

      case "grow":
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Grow Phase</h3>
            {actionTakenInPhase ? (
              <p className="text-sm text-green-500 my-2">Đã Grow.</p>
            ) : (
              <Button
                onClick={openZoneViewer}
                className="w-full mt-2"
                variant="secondary"
              >
                Xem LRIG Deck
              </Button>
            )}
            <Button
              onClick={dispatchAdvancePhaseAction}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );

      // Tạm thời các phase khác chỉ có nút Next
      case "end":
        const handSize =
          world
            ?.query([ZoneComponent])
            .filter(
              (e) => world.getComponent(e, ZoneComponent)!.zone === "hand"
            ).length ?? 0;
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
              onClick={dispatchAdvancePhaseAction}
              className="w-full mt-2"
              disabled={mustDiscard}
            >
              Kết thúc Lượt
            </Button>
          </>
        );
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
        <Button onClick={dispatchStartSetupAction} className="w-full" size="lg">
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
