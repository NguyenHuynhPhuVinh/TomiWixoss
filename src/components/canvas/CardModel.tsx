// src/components/canvas/CardModel.tsx
"use client";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useMemo, memo } from "react"; // <-- IMPORT memo
import { CardInstance } from "@/types/game";

// Đưa các hằng số ra ngoài để có thể tái sử dụng
export const CARD_WIDTH = 1.5; // 0.75 * 2 - Tăng gấp đôi
export const CARD_HEIGHT = 2.094; // 1.047 * 2 - Tăng gấp đôi
export const CARD_THICKNESS = 0.03; // Tăng nhẹ để cân đối hơn

interface CardModelProps {
  card: CardInstance;
  // Bỏ prop shouldGlow
}

const CardModel = memo(function CardModel({ card }: CardModelProps) {
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
      if (tex) {
        tex.anisotropy = 16;
        tex.colorSpace = THREE.SRGBColorSpace;
      }
    });
  }, [frontTexture, backTexture]);

  const materials = useMemo(() => {
    // Xóa logic emissive và emissiveIntensity
    const frontMat = new THREE.MeshStandardMaterial({ map: frontTexture });
    const backMat = new THREE.MeshStandardMaterial({ map: backTexture });
    const edgeMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a" });

    return [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      card.isFaceUp ? frontMat : backMat,
      card.isFaceUp ? backMat : frontMat,
    ];
  }, [frontTexture, backTexture, card.isFaceUp]);

  const width = card.isHorizontal ? CARD_HEIGHT : CARD_WIDTH;
  const height = card.isHorizontal ? CARD_WIDTH : CARD_HEIGHT;

  return (
    <mesh material={materials}>
      <boxGeometry args={[width, height, CARD_THICKNESS]} />
    </mesh>
  );
});

export default CardModel;
