// src/components/canvas/GameBoard.tsx
"use client";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useMemo } from "react"; // Import useMemo

// Định nghĩa kiểu cho props để tận dụng TypeScript
interface GameBoardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// Thêm props vào component
export default function GameBoard({
  position = [0, -0.5, 0],
  rotation = [-Math.PI / 2, 0, 0],
}: GameBoardProps) {
  // Bọc việc load texture trong useMemo để nó chỉ load một lần
  // ngay cả khi component được render lại. Điều này rất quan trọng
  // khi có nhiều instance của GameBoard.
  const texture = useLoader(TextureLoader, "/textures/playmat.jpg");

  // Tương tự, bọc các thiết lập texture trong useMemo
  useMemo(() => {
    const maxAnisotropy = 16;
    texture.anisotropy = maxAnisotropy;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const imageAspectRatio = 4961 / 3508;
  const boardWidth = 12;
  const boardHeight = boardWidth / imageAspectRatio;

  return (
    // Sử dụng props cho vị trí và góc xoay
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[boardWidth, boardHeight]} />
      <meshStandardMaterial map={texture} roughness={0.8} />
    </mesh>
  );
}
