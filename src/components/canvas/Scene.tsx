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
import ZoneHelper from "./ZoneHelper"; // <-- IMPORT HELPER
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";

interface SceneProps {
  onDeckClick: () => void;
}

// Kích thước chuẩn cho các loại zone
const SIGNI_ZONE_SIZE: [number, number, number] = [2.2, 0.02, 2.2];
const LRIG_ZONE_SIZE: [number, number, number] = [2.2, 0.02, 2.2];
const DECK_ZONE_SIZE: [number, number, number] = [0.8, 0.5, 1.1]; // Cao hơn để chứa chồng bài
const ENER_ZONE_SIZE: [number, number, number] = [1.5, 0.02, 6];
const LIFE_CLOTH_ZONE_SIZE: [number, number, number] = [6.25, 0.02, 1.75];
const CHECK_ZONE_SIZE: [number, number, number] = [2, 0.02, 2];

// Component chứa tất cả các zone của một người chơi
function PlayerZones({
  player,
  color,
}: {
  player: "p1" | "p2";
  color: string;
}) {
  // Lật ngược tọa độ nếu là người chơi 2
  const m = player === "p1" ? 1 : -1;
  const labelPrefix = player === "p1" ? "P1" : "P2";

  return (
    <group>
      {/* SIGNI Zones */}
      <ZoneHelper
        position={[-2.7 * m, 0.01, 1.5 * m]}
        size={SIGNI_ZONE_SIZE}
        label={`${labelPrefix} SIGNI 1`}
        color={color}
      />
      <ZoneHelper
        position={[0 * m, 0.01, 1.5 * m]}
        size={SIGNI_ZONE_SIZE}
        label={`${labelPrefix} SIGNI 2`}
        color={color}
      />
      <ZoneHelper
        position={[2.7 * m, 0.01, 1.5 * m]}
        size={SIGNI_ZONE_SIZE}
        label={`${labelPrefix} SIGNI 3`}
        color={color}
      />

      {/* LRIG Zones */}
      <ZoneHelper
        position={[-2.8 * m, 0.01, 4.95 * m]}
        size={LRIG_ZONE_SIZE}
        label={`${labelPrefix} ASSIST LRIG 1`}
        color={color}
      />
      <ZoneHelper
        position={[0 * m, 0.01, 4.7 * m]}
        size={LRIG_ZONE_SIZE}
        label={`${labelPrefix} CENTER LRIG`}
        color={color}
      />
      <ZoneHelper
        position={[2.8 * m, 0.01, 4.95 * m]}
        size={LRIG_ZONE_SIZE}
        label={`${labelPrefix} ASSIST LRIG 2`}
        color={color}
      />

      {/* Deck & Trash */}
      <ZoneHelper
        position={[5.2 * m, 0.25, 2.5 * m]}
        size={DECK_ZONE_SIZE}
        label={`${labelPrefix} MAIN DECK`}
        color={color}
      />
      <ZoneHelper
        position={[5.2 * m, 0.01, 1.5 * m]}
        size={SIGNI_ZONE_SIZE}
        label={`${labelPrefix} TRASH`}
        color={color}
      />
      <ZoneHelper
        position={[5.2 * m, 0.25, -2.5 * m]}
        size={DECK_ZONE_SIZE}
        label={`${labelPrefix} LRIG DECK`}
        color={color}
      />
      <ZoneHelper
        position={[5.2 * m, 0.01, -1.5 * m]}
        size={LRIG_ZONE_SIZE}
        label={`${labelPrefix} LRIG TRASH`}
        color={color}
      />

      {/* Other Zones */}
      <ZoneHelper
        position={[-5.2 * m, 0.01, 0 * m]}
        size={ENER_ZONE_SIZE}
        label={`${labelPrefix} ENER ZONE`}
        color={color}
      />
      <ZoneHelper
        position={[-0.7 * m, 0.01, 7.6 * m]}
        size={LIFE_CLOTH_ZONE_SIZE}
        label={`${labelPrefix} LIFE CLOTH`}
        color={color}
      />
      <ZoneHelper
        position={[-5.2 * m, 0.01, 3.0 * m]}
        size={CHECK_ZONE_SIZE}
        label={`${labelPrefix} CHECK ZONE`}
        color={color}
      />
    </group>
  );
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

      {/* === VÙNG DEBUG HELPER === */}
      {/* Đặt chúng bên trong một group để có thể dễ dàng bật/tắt */}
      <group>
        <PlayerZones player="p1" color="cyan" />
        <PlayerZones player="p2" color="tomato" />
      </group>
      {/* === KẾT THÚC VÙNG DEBUG === */}

      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
