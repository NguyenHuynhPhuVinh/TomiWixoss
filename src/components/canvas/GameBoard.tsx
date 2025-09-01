// src/components/canvas/GameBoard.tsx
"use client";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useMemo } from "react";

interface GameBoardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function GameBoard({
  position = [0, -0.5, 0],
  rotation = [-Math.PI / 2, 0, 0],
}: GameBoardProps) {
  const texture = useLoader(TextureLoader, "/textures/playmat.png");

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

  const imageAspectRatio = 4962 / 3509;
  const boardWidth = 12;
  const boardHeight = boardWidth / imageAspectRatio;

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[boardWidth, boardHeight]} />
      {/* <--- KHÔI PHỤC LẠI VẬT LIỆU GỐC TẠI ĐÂY ---> */}
      <meshStandardMaterial
        map={texture}
        roughness={
          0.9
        } /* Giữ độ nhám cao để giảm phản chiếu, giúp màu sắc rõ hơn */
      />
    </mesh>
  );
}
