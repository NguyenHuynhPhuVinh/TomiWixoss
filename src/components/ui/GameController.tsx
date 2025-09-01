// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import { Button } from "./button";

// --- THAY ĐỔI LỚN ---
import { world, globalEntity } from "@/logic/ecs/world.miniplex";
import { Entity } from "@/logic/ecs/types.miniplex";
import {
  advancePhaseAction,
  startSetupAction,
  confirmMulliganAction,
} from "@/logic/actions.miniplex";
// === THAY ĐỔI: Import constants ===
import { GamePhase, Zone } from "@/logic/constants";
import { cancelPlayerActionInECS } from "@/logic/actions.miniplex"; // <-- Import action mới

export default function GameController() {
  // === THAY ĐỔI: Chỉ dùng useStore để trigger re-render ===
  // Component này sẽ render lại mỗi khi worldVersion thay đổi
  useStore(useGameStore, (state) => state.worldVersion);

  // === THAY ĐỔI: Đọc state trực tiếp từ globalEntity ===
  const phase = globalEntity.globalState?.phase;
  const turn = globalEntity.globalState?.turn;
  const actionTakenInPhase = globalEntity.globalState?.actionTakenInPhase;
  const mulliganSelectionCount =
    globalEntity.globalState?.mulliganSelection.length ?? 0;
  const playerAction = globalEntity.globalState?.playerAction; // <-- ĐỌC TỪ ĐÂY

  // Lấy các state/action của UI từ Zustand
  const mustDiscard = useStore(useGameStore, (state) => state.mustDiscard);
  const openZoneViewer = useGameStore((state) => state.openZoneViewer);
  // const playerAction = useStore(useGameStore, (state) => state.playerAction); // <-- KHÔNG CẦN NỮA
  // const cancelPlayerAction = useStore( // <-- KHÔNG CẦN NỮA
  //   useGameStore,
  //   (state) => state.cancelPlayerAction
  // );

  const renderContent = () => {
    if (playerAction?.type === "place_signi") {
      return (
        <>
          <p className="text-sm text-blue-400 mb-2 animate-pulse">
            Chọn một ô SIGNI trống trên sân...
          </p>
          <Button
            onClick={cancelPlayerActionInECS} // <-- GỌI TRỰC TIẾP ACTION CỦA ECS
            variant="destructive"
            size="sm"
            className="w-full mt-2"
          >
            Hủy
          </Button>
        </>
      );
    }

    switch (phase) {
      case GamePhase.PRE_GAME:
        return <Button onClick={startSetupAction}>Chuẩn bị</Button>;

      case GamePhase.SELECTING_LRIGS:
        return (
          <p className="text-muted-foreground animate-pulse">
            Vui lòng chọn LRIG...
          </p>
        );

      case GamePhase.UP:
      case GamePhase.DRAW:
        const phaseTextAuto = (phase.charAt(0).toUpperCase() +
          phase.slice(1)) as string;
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

      case GamePhase.ENER:
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
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );

      case GamePhase.MULLIGAN:
        return (
          <>
            <p className="text-muted-foreground mb-4">
              Chọn các lá bài trên tay muốn đổi.
              <br />
              <span className="font-bold">
                Đã chọn: {mulliganSelectionCount}
              </span>
            </p>
            <Button onClick={confirmMulliganAction} className="w-full">
              Xác nhận đổi bài
            </Button>
          </>
        );

      case GamePhase.GROW:
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
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );

      case GamePhase.END:
        const handSize = world
          ? Array.from(
              world
                .with("zone")
                .where((e: Entity) => e.zone?.zone === Zone.HAND)
            ).length
          : 0;
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
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
              disabled={mustDiscard}
            >
              Kết thúc Lượt
            </Button>
          </>
        );
      default:
        const phaseText = phase
          ? phase.charAt(0).toUpperCase() + phase.slice(1)
          : "Loading...";
        return (
          <>
            <h3 className="font-bold">
              Turn {turn} - {phaseText} Phase
            </h3>
            <Button
              onClick={() => advancePhaseAction()}
              className="w-full mt-2"
            >
              Next Phase
            </Button>
          </>
        );
    }
  };

  if (phase === GamePhase.PRE_GAME) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">
          TomiWixoss
        </h2>
        <p className="text-muted-foreground mb-6">
          Sẵn sàng để bắt đầu một trận đấu.
        </p>
        <Button onClick={startSetupAction} className="w-full" size="lg">
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
