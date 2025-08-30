// src/components/canvas/Scene.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import GameBoard from "./GameBoard"; // Import component bàn đấu

export default function Scene() {
  return (
    <Canvas>
      {/* Camera: Điều chỉnh vị trí để nhìn bàn đấu từ trên xuống */}
      <PerspectiveCamera makeDefault position={[0, 8, 10]} fov={60} />
      <OrbitControls
        minDistance={5} // Giới hạn zoom gần nhất
        maxDistance={20} // Giới hạn zoom xa nhất
        maxPolarAngle={Math.PI / 2.1} // Giới hạn góc nhìn, không cho nhìn xuống dưới gầm bàn
      />

      {/* Ánh sáng: Tăng cường độ để bàn đấu sáng rõ */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[0, 10, 5]} intensity={1.5} />

      {/* Render bàn đấu của chúng ta */}
      <GameBoard />

      {/* (Optional) Thêm một vài khối hộp để làm lá bài mẫu */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.88]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </Canvas>
  );
}
