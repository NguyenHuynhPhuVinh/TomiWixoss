// src/components/canvas/Scene.tsx
"use client";

import { useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Preload,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";

interface SceneProps {
  onDeckClick: () => void;
}

export default function Scene({ onDeckClick }: SceneProps) {
  const playerMainDeck = useStore(
    useGameStore,
    (state) => state.player.mainDeck
  );
  const playerLrigDeck = useStore(
    useGameStore,
    (state) => state.player.lrigDeck
  );
  const initializeGame = useStore(
    useGameStore,
    (state) => state.initializeGame
  );

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const boardWidth = 12;
  const boardHeight = boardWidth / (4962 / 3509);

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 15, 0.1]} fov={60} />
      <OrbitControls minDistance={5} maxDistance={25} />

      <Environment preset="city" />
      <ambientLight intensity={1} />
      <directionalLight position={[0, 20, 10]} intensity={1.5} castShadow />

      <GameBoard
        position={[0, 0, boardHeight / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      <GameBoard
        position={[0, 0, -(boardHeight / 2)]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />

      {/* Vùng click vô hình cho Main Deck */}
      <mesh
        position={[5.2, 0.1, 2.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={playerMainDeck.length > 0} // Chỉ hiện khi còn bài
        onClick={onDeckClick} // <-- Gọi prop được truyền vào
      >
        <planeGeometry args={[1, 1.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Render các lá bài của Main Deck (không cần animation nữa) */}
      {playerMainDeck.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[5.2, 0.01 * index, 2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      {/* Tạm thời vô hiệu hóa click LRIG Deck */}
      {playerLrigDeck.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[5.2, 0.01 * index, 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
