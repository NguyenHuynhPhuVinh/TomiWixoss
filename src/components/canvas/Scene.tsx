// src/components/canvas/Scene.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import GameBoard from "./GameBoard";

export default function Scene() {
  const boardWidth = 12;
  const boardHeight = boardWidth / (4961 / 3508);
  // const gap = 0.2; // <--- XÓA DÒNG NÀY HOẶC ĐẶT BẰNG 0

  return (
    <Canvas>
      {/* 1. Điều chỉnh Camera để bao quát cả hai bàn */}
      <PerspectiveCamera makeDefault position={[0, 15, 0.1]} fov={60} />
      <OrbitControls
        minDistance={8}
        maxDistance={25}
        // Giới hạn góc nhìn để không bị lật ngược
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        // Cho phép di chuyển camera song song với bàn đấu
        enablePan={true}
      />

      {/* 2. Ánh sáng và Môi trường */}
      {/* Environment giúp cảnh có ánh sáng và phản chiếu tự nhiên hơn */}
      <Environment preset="city" />
      <ambientLight intensity={1} />
      <directionalLight
        position={[0, 20, 10]}
        intensity={1.5}
        castShadow // Bật đổ bóng
      />

      {/* 3. Bàn đấu của Người chơi 1 (phía dưới) */}
      {/* Loại bỏ 'gap / 2' khỏi phép tính */}
      <GameBoard
        position={[0, 0, boardHeight / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* 4. Bàn đấu của Người chơi 2 (phía trên) */}
      {/* Loại bỏ 'gap / 2' khỏi phép tính */}
      <GameBoard
        position={[0, 0, -(boardHeight / 2)]}
        // Xoay 180 độ quanh trục Y để nó đối diện với người chơi 1
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
    </Canvas>
  );
}
