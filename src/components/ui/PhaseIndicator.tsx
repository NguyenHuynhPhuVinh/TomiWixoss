// src/components/ui/PhaseIndicator.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";

export default function PhaseIndicator() {
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const goToNextPhase = useGameStore((state) => state.goToNextPhase);

  const phaseText = phase.charAt(0).toUpperCase() + phase.slice(1);

  return (
    <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-lg z-10 border text-center">
      <h3 className="text-lg font-bold text-card-foreground">Turn {turn}</h3>
      <p className="text-muted-foreground mb-4">{phaseText} Phase</p>
      <Button onClick={goToNextPhase} className="w-full">
        Next Phase
      </Button>
    </div>
  );
}
