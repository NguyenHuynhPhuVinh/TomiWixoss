// src/components/canvas/Scene.tsx
"use client";

import { Suspense, useEffect } from "react";
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
// --- IMPORT TỌA ĐỘ ---
import { P1_ZONE_COORDINATES, CARD_DIMENSIONS } from "@/data/zoneCoordinates";

interface SceneProps {
  onDeckClick: () => void;
}

// Kích thước chuẩn cho các loại zone
const SIGNI_ZONE_SIZE: [number, number, number] = [2.2, 0.02, 2.2];
const LRIG_ZONE_SIZE: [number, number, number] = [2.2, 0.02, 2.2];
const DECK_ZONE_SIZE: [number, number, number] = [0.8, 0.5, 1.1]; // Cao hơn để chứa chồng bài
const ENER_ZONE_SIZE: [number, number, number] = [1.5, 0.02, 5];
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
        position={[5.2 * m, 0.25, 1.5 * m]}
        size={DECK_ZONE_SIZE}
        label={`${labelPrefix} MAIN DECK`}
        color={color}
      />
      <ZoneHelper
        position={[6.6 * m, 0.01, 4.25 * m]}
        size={SIGNI_ZONE_SIZE}
        label={`${labelPrefix} TRASH`}
        color={color}
      />
      <ZoneHelper
        position={[3.75 * m, 0.25, 7.75 * m]}
        size={DECK_ZONE_SIZE}
        label={`${labelPrefix} LRIG DECK`}
        color={color}
      />
      <ZoneHelper
        position={[6.6 * m, 0.01, 7 * m]}
        size={LRIG_ZONE_SIZE}
        label={`${labelPrefix} LRIG TRASH`}
        color={color}
      />

      {/* Other Zones */}
      <ZoneHelper
        position={[-5.2 * m, 0.01, 3.3 * m]}
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
        position={[-5 * m, 0.01, 7.25 * m]}
        size={CHECK_ZONE_SIZE}
        label={`${labelPrefix} CHECK ZONE`}
        color={color}
      />
    </group>
  );
}

export default function Scene({ onDeckClick }: SceneProps) {
  // Lấy từng phần state một cách riêng biệt để tránh vòng lặp render
  const player = useStore(useGameStore, (state) => state.player);
  const initializeGame = useStore(
    useGameStore,
    (state) => state.initializeGame
  );

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const coords = P1_ZONE_COORDINATES;

  const boardWidth = 12;
  const boardHeight = boardWidth / (4962 / 3509);

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 18, 0.1]} fov={60} />
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

      {/* === RENDER CÁC THÀNH PHẦN TRÊN BÀN ĐẤU CỦA NGƯỜI CHƠI 1 === */}

      {/* MAIN DECK */}
      <mesh
        position={[coords.MAIN_DECK.x, coords.MAIN_DECK.y, coords.MAIN_DECK.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={player.mainDeck.length > 0}
        onClick={onDeckClick}
      >
        <planeGeometry
          args={[CARD_DIMENSIONS.width + 0.1, CARD_DIMENSIONS.height + 0.1]}
        />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {player.mainDeck.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.MAIN_DECK.x,
            coords.MAIN_DECK.y + CARD_DIMENSIONS.thickness * index,
            coords.MAIN_DECK.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      {/* LRIG DECK */}
      {player.lrigDeck.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.LRIG_DECK.x,
            coords.LRIG_DECK.y + CARD_DIMENSIONS.thickness * index,
            coords.LRIG_DECK.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      {/* LRIG ZONE */}
      {player.lrigZone.map((card, index) => {
        if (!card) return null;
        const lrigCoords = [
          coords.ASSIST_LRIG_1,
          coords.CENTER_LRIG,
          coords.ASSIST_LRIG_2,
        ][index];
        return (
          <Card
            key={card.uuid}
            card={card}
            position={[lrigCoords.x, lrigCoords.y, lrigCoords.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        );
      })}

      {/* === CẬP NHẬT LOGIC RENDER LIFE CLOTH === */}
      {player.lifeCloth.map((card, index) => {
        // Khoảng cách nhỏ giữa các lá bài xếp chồng
        const stackOffsetX = 0.67; // Dịch chuyển sang phải cho mỗi lá để xòe rộng dải bài
        const stackOffsetY = CARD_DIMENSIONS.thickness; // Nâng lên một chút để không bị z-fighting

        return (
          <Card
            key={card.uuid}
            card={card}
            position={[
              // Vị trí X: Bắt đầu từ tọa độ gốc của Life Cloth và dịch sang phải một chút cho mỗi lá
              coords.LIFE_CLOTH.x + index * stackOffsetX,
              // Vị trí Y: Nâng mỗi lá bài lên một chút so với lá dưới nó
              coords.LIFE_CLOTH.y + index * stackOffsetY,
              // Vị trí Z: Giữ nguyên tọa độ Z của khu vực Life Cloth
              coords.LIFE_CLOTH.z,
            ]}
            rotation={[
              -Math.PI / 2, // 1. Xoay 90 độ để nằm phẳng trên bàn
              0, // 2. Không xoay quanh trục Y
              Math.PI / 2, // 3. Xoay 90 độ để lá bài nằm ngang
            ]}
          />
        );
      })}
      {/* === KẾT THÚC CẬP NHẬT === */}

      {/* TODO: Render các lá bài trong SIGNI Zone, Ener Zone, Trash... tương tự */}

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
