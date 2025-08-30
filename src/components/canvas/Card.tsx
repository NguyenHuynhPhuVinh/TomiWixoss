// src/components/canvas/Card.tsx
"use client";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useMemo } from "react";
import { CardInstance } from "@/types/game";

// Kích thước chuẩn của một lá bài trong không gian 3D
const CARD_WIDTH = 0.75;
const CARD_HEIGHT = 1.047;
const CARD_THICKNESS = 0.02;

interface CardProps {
  card: CardInstance;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function Card({ card, position, rotation }: CardProps) {
  // Load texture mặt trước và các mặt sau
  const frontTexture = useLoader(TextureLoader, card.imageUrl);
  const mainBackTexture = useLoader(
    TextureLoader,
    "/textures/cardback/MAIN.png"
  );
  const lrigBackTexture = useLoader(
    TextureLoader,
    "/textures/cardback/LRIG.png"
  );
  const pieceBackTexture = useLoader(
    TextureLoader,
    "/textures/cardback/PIECE.png"
  );

  // Chọn mặt sau phù hợp
  const backTexture = useMemo(() => {
    switch (card.backType) {
      case "LRIG":
        return lrigBackTexture;
      case "PIECE":
        return pieceBackTexture;
      default:
        return mainBackTexture;
    }
  }, [card.backType, mainBackTexture, lrigBackTexture, pieceBackTexture]);

  // Tối ưu hóa các texture
  useMemo(() => {
    [frontTexture, backTexture].forEach((tex) => {
      tex.anisotropy = 16;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });
  }, [frontTexture, backTexture]);

  // Vật liệu cho các mặt của lá bài
  // Chúng ta sẽ dùng 6 vật liệu cho 6 mặt của khối hộp
  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: "black" }), // right side
      new THREE.MeshStandardMaterial({ color: "black" }), // left side
      new THREE.MeshStandardMaterial({ color: "black" }), // top side
      new THREE.MeshStandardMaterial({ color: "black" }), // bottom side
      new THREE.MeshStandardMaterial({ map: frontTexture }), // front
      new THREE.MeshStandardMaterial({ map: backTexture }), // back
    ],
    [frontTexture, backTexture]
  );

  // Xác định kích thước dựa trên lá bài là dọc hay ngang
  const width = card.isHorizontal ? CARD_HEIGHT : CARD_WIDTH;
  const height = card.isHorizontal ? CARD_WIDTH : CARD_HEIGHT;

  return (
    <mesh position={position} rotation={rotation} material={materials}>
      <boxGeometry args={[width, height, CARD_THICKNESS]} />
    </mesh>
  );
}
