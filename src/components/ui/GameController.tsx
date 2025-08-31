// src/components/ui/GameController.tsx
"use client";
import useGameStore from "@/store/gameStore";
import { Button } from "./button";
import { useStore } from "zustand";

export default function GameController() {
  const gameStarted = useStore(useGameStore, (state) => state.gameStarted);
  const setupDecks = useStore(useGameStore, (state) => state.setupDecks);

  // Nếu game đã bắt đầu, không hiển thị gì cả
  if (gameStarted) {
    return null;
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg z-10 border text-center pointer-events-auto">
      <h2 className="text-2xl font-bold mb-2 text-card-foreground">
        TomiWixoss
      </h2>
      <p className="text-muted-foreground mb-6">
        Sẵn sàng để bắt đầu một trận đấu.
      </p>
      <Button onClick={setupDecks} className="w-full" size="lg">
        Chuẩn bị
      </Button>
    </div>
  );
}
