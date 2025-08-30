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
  // Phần load texture và tối ưu hóa giữ nguyên
  // Chỉ cần đảm bảo đường dẫn đúng với file PNG mới của bạn
  const texture = useLoader(TextureLoader, "/textures/playmat.png"); // <-- Đảm bảo tên file đúng

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

  // THAY ĐỔI Ở ĐÂY: Cập nhật tỉ lệ khung hình mới
  const imageAspectRatio = 4962 / 3509; // Tỉ lệ mới ~1.41407
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
