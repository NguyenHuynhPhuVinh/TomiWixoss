// src/components/canvas/Scene.tsx
"use client"; // Rất quan trọng! Component 3D cần chạy ở phía client.

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function Scene() {
  return (
    <Canvas>
      {/* Ánh sáng */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Một khối hộp đơn giản để kiểm tra */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      {/* Điều khiển camera */}
      <OrbitControls />
    </Canvas>
  );
}
