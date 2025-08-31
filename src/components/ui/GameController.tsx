// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";
import { useStore } from "zustand";
import gameManager from "@/logic/ecs/game.manager";
import { GamePhase } from "@/types/game";

export default function GameController() {
  const { phase, turn, startGame, setPhase } = useStore(useGameStore, (state) => ({
    phase: state.phase,
    turn: state.turn,
    startGame: state.startGame,
    setPhase: state.setPhase,
  }));

  const handleNextPhase = () => {
    // Tạm thời hard-code luồng phase
    const phaseOrder: GamePhase[] = ['up', 'draw', 'ener', 'grow', 'main', 'attack', 'end'];
    const currentIndex = phaseOrder.indexOf(phase);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= phaseOrder.length) {
      setPhase(phaseOrder[0]);
    } else {
      setPhase(phaseOrder[nextIndex]);
    }
  }

  const renderContent = () => {
    switch (phase) {
      case 'pre_game':
        return <Button onClick={startGame}>Chuẩn bị</Button>;
      
      case 'up':
        return (
          <>
            <h3 className="font-bold">Turn {turn} - Up Phase</h3>
            <Button onClick={() => gameManager.forceUpdate()} className="w-full mt-2">
              Up All Cards
            </Button>
            <Button onClick={handleNextPhase} variant="outline" className="w-full mt-2">
              Next Phase
            </Button>
          </>
        );
      
      // Tạm thời các phase khác chỉ có nút Next
      default:
        const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);
        return (
          <>
            <h3 className="font-bold">Turn {turn} - {phaseText} Phase</h3>
            <Button onClick={handleNextPhase} className="w-full mt-2">
              Next Phase
            </Button>
          </>
        );
    }
  };
  
  // ... JSX render controller ...
  if (phase === 'pre_game') {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">
          TomiWixoss
        </h2>
        <p className="text-muted-foreground mb-6">
          Sẵn sàng để bắt đầu một trận đấu.
        </p>
        <Button onClick={startGame} className="w-full" size="lg">
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
