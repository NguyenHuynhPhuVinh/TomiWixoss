// src/components/canvas/Card.tsx
"use client";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useMemo } from "react";
import { CardInstance } from "@/types/game";

const CARD_WIDTH = 0.75;
const CARD_HEIGHT = 1.047;
const CARD_THICKNESS = 0.02;

interface CardProps {
  card: CardInstance;
  position: [number, number, number];
  rotation: [number, number, number];
  onClick?: () => void; // Prop mới cho sự kiện click
}

export default function Card({ card, position, rotation, onClick }: CardProps) {
  // --- Phần load texture giữ nguyên ---
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

  useMemo(() => {
    [frontTexture, backTexture].forEach((tex) => {
      tex.anisotropy = 16;
      tex.colorSpace = THREE.SRGBColorSpace;
    });
  }, [frontTexture, backTexture]);

  // === GIẢI PHÁP SỬA LỖI HIỂN THỊ ===
  // Vật liệu cho các mặt của lá bài
  const materials = useMemo(() => {
    const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture });
    const backMaterial = new THREE.MeshStandardMaterial({ map: backTexture });
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: "black" });

    // Khi lá bài úp (isFaceUp = false), chúng ta muốn mặt sau hiển thị ở cả hai phía
    // để khi xoay lên xem, mặt trước sẽ hiện ra đúng.
    // Khi lá bài ngửa, mặt trước sẽ hiển thị.
    return [
      edgeMaterial, // right
      edgeMaterial, // left
      edgeMaterial, // top
      edgeMaterial, // bottom
      card.isFaceUp ? frontMaterial : backMaterial, // front face
      card.isFaceUp ? backMaterial : frontMaterial, // back face <--- Lỗi nằm ở đây, phải tráo đổi
    ];
  }, [frontTexture, backTexture, card.isFaceUp]);
  // Chúng ta sẽ điều khiển việc úp/ngửa bằng state isFaceUp và góc xoay.

  const width = card.isHorizontal ? CARD_HEIGHT : CARD_WIDTH;
  const height = card.isHorizontal ? CARD_WIDTH : CARD_HEIGHT;

  return (
    <mesh
      position={position}
      rotation={rotation}
      material={materials}
      onClick={(e) => {
        e.stopPropagation(); // Ngăn click xuyên qua các đối tượng khác
        if (onClick) onClick();
      }}
    >
      <boxGeometry args={[width, height, CARD_THICKNESS]} />
    </mesh>
  );
}
