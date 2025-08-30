// src/app/page.tsx
import Scene from "@/components/canvas/Scene";

export default function Home() {
  return (
    <main className="w-screen h-screen">
      {/* Canvas sẽ chiếm toàn bộ màn hình */}
      <Scene />
    </main>
  );
}
