// src/components/ui/ClientOnlyLoader.tsx
"use client";
import dynamic from "next/dynamic";
import Scene from "@/components/canvas/Scene";

// DevPanel vẫn được load dynamic để đảm bảo nó chỉ chạy ở client
const DevPanel = dynamic(() => import("@/components/ui/DevPanel"), {
  ssr: false,
});

export default function ClientOnlyLoader() {
  return (
    <>
      <DevPanel />
      <Scene />
    </>
  );
}
