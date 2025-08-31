// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});
const GameController = dynamic(() => import("@/components/ui/GameController"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <GameController />
      </div>

      <Scene />
    </>
  );
}
