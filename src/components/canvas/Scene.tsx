// src/components/canvas/Scene.tsx
"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Preload,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card";
// import ZoneHelper from "./ZoneHelper"; // <-- IMPORT HELPER - COMMENTED OUT
// import InteractiveZone from "./InteractiveZone";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
// --- IMPORT TỌA ĐỘ ---
import { P1_ZONE_COORDINATES, CARD_DIMENSIONS } from "@/data/zoneCoordinates";

// src/components/canvas/Scene.tsx

// Bỏ interface SceneProps và props khỏi component
export default function Scene() {
  // Lấy từng phần state một cách riêng biệt để tránh vòng lặp render
  const player = useStore(useGameStore, (state) => state.player);
  // const initializeGame = useStore(
  //   useGameStore,
  //   (state) => state.initializeGame
  // );

  // useEffect(() => {
  //   initializeGame();
  // }, [initializeGame]);

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
      {player.mainDeck.length > 0 && ( // Chỉ render vùng click nếu có bài
        <mesh
          // Vị trí của hộp click sẽ được đặt ở giữa chiều cao của chồng bài
          position={[
            coords.MAIN_DECK.x,
            coords.MAIN_DECK.y +
              (player.mainDeck.length * CARD_DIMENSIONS.thickness) / 2,
            coords.MAIN_DECK.z,
          ]}
          // onClick={onMainDeckClick}
        >
          {/* Thay thế plane bằng box */}
          <boxGeometry
            args={[
              CARD_DIMENSIONS.width + 0.1, // Chiều rộng (giữ nguyên)
              CARD_DIMENSIONS.height + 0.1, // Chiều dài (giữ nguyên)
              player.mainDeck.length * CARD_DIMENSIONS.thickness, // Chiều cao (độ dày) động
            ]}
          />
          {/* Vật liệu vẫn vô hình */}
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
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
      {player.lrigDeck.length > 0 && (
        <mesh
          position={[
            coords.LRIG_DECK.x,
            coords.LRIG_DECK.y +
              (player.lrigDeck.length * CARD_DIMENSIONS.thickness) / 2,
            coords.LRIG_DECK.z,
          ]}
          // onClick={onLrigDeckClick}
        >
          <boxGeometry
            args={[
              // Kích thước của hộp click cho LRIG Deck sẽ hoán đổi width/height
              // vì các lá bài nằm ngang
              CARD_DIMENSIONS.height + 0.1, // Width của hộp = Height của bài
              CARD_DIMENSIONS.width + 0.1, // Height của hộp = Width của bài
              player.lrigDeck.length * CARD_DIMENSIONS.thickness,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
      {player.lrigDeck.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.LRIG_DECK.x,
            coords.LRIG_DECK.y + CARD_DIMENSIONS.thickness * index,
            coords.LRIG_DECK.z,
          ]}
          rotation={[
            -Math.PI / 2, // Nằm phẳng
            0,
            // Nếu là PIECE (vốn đã ngang) thì không xoay (0).
            // Nếu là LRIG (dọc) thì xoay 90 độ (Math.PI / 2) để thành ngang.
            card.type === "PIECE" ? 0 : Math.PI / 2,
          ]}
        />
      ))}

      {/* === BẬT LẠI RENDER CÁC ZONE KHÁC === */}

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

      {/* LIFE CLOTH */}
      {player.lifeCloth.map((card, index) => {
        const stackOffsetX = 0.67;
        const stackOffsetY = CARD_DIMENSIONS.thickness;
        return (
          <Card
            key={card.uuid}
            card={card}
            position={[
              coords.LIFE_CLOTH.x + index * stackOffsetX,
              coords.LIFE_CLOTH.y + index * stackOffsetY,
              coords.LIFE_CLOTH.z,
            ]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          />
        );
      })}

      {/* TRASH (Mộ bài chính) */}
      {player.trash.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.TRASH.x,
            coords.TRASH.y + index * CARD_DIMENSIONS.thickness, // Xếp chồng lên
            coords.TRASH.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      {/* Vùng click động cho Trash */}
      {player.trash.length > 0 && (
        <mesh
          position={[
            coords.TRASH.x,
            coords.TRASH.y +
              (player.trash.length * CARD_DIMENSIONS.thickness) / 2,
            coords.TRASH.z,
          ]}
        >
          <boxGeometry
            args={[
              CARD_DIMENSIONS.width + 0.1,
              CARD_DIMENSIONS.height + 0.1,
              player.trash.length * CARD_DIMENSIONS.thickness,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Tạm thời ẩn các zone khác để tập trung vào mainDeck và lrigDeck */}

      {/* Tạm thời ẩn các zone khác để tập trung vào mainDeck và lrigDeck */}

      {/* === VÙNG DEBUG HELPER === */}

      {/* === VÙNG DEBUG HELPER === */}
      {/* 
      <group>
        <PlayerZones player="p1" color="cyan" />
        <PlayerZones player="p2" color="tomato" />
      </group>
      */}
      {/* === KẾT THÚC VÙNG DEBUG === */}

      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
