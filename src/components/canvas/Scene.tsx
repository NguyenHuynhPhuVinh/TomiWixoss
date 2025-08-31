// src/components/canvas/Scene.tsx
"use client";

import { Suspense } from "react"; // Bỏ useEffect vì không còn dùng initializeGame
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
import { P1_ZONE_COORDINATES, CARD_DIMENSIONS } from "@/data/zoneCoordinates";

// Component này không cần props nữa vì nó lấy mọi thứ từ store
export default function Scene() {
  const player = useStore(useGameStore, (state) => state.player);
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

      {/* --- BÀN ĐẤU (Không thay đổi) --- */}
      <GameBoard
        position={[0, 0, boardHeight / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <GameBoard
        position={[0, 0, -(boardHeight / 2)]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />

      {/* === RENDER CÁC THÀNH PHẦN TRÊN BÀN ĐẤU CỦA NGƯỜI CHƠI === */}

      {/* --- CÁC ZONE ĐÃ CÓ (Không thay đổi) --- */}

      {/* MAIN DECK */}
      {player.mainDeck.length > 0 && (
        <mesh
          position={[
            coords.MAIN_DECK.x,
            coords.MAIN_DECK.y +
              (player.mainDeck.length * CARD_DIMENSIONS.thickness) / 2,
            coords.MAIN_DECK.z,
          ]}
        >
          <boxGeometry
            args={[
              CARD_DIMENSIONS.width + 0.1,
              CARD_DIMENSIONS.height + 0.1,
              player.mainDeck.length * CARD_DIMENSIONS.thickness,
            ]}
          />
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
        >
          <boxGeometry
            args={[
              CARD_DIMENSIONS.height + 0.1,
              CARD_DIMENSIONS.width + 0.1,
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
          rotation={[-Math.PI / 2, 0, card.type === "PIECE" ? 0 : Math.PI / 2]}
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

      {/* LIFE CLOTH */}
      {player.lifeCloth.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.LIFE_CLOTH.x + index * 0.67,
            coords.LIFE_CLOTH.y + index * CARD_DIMENSIONS.thickness,
            coords.LIFE_CLOTH.z,
          ]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        />
      ))}

      {/* ENER ZONE (Giữ nguyên code đẹp của bạn) */}
      {player.enerZone.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.ENER_ZONE.x,
            coords.ENER_ZONE.y +
              (player.enerZone.length - 1 - index) * CARD_DIMENSIONS.thickness,
            coords.ENER_ZONE.z + index * 0.7,
          ]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
        />
      ))}

      {/* TRASH */}
      {player.trash.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.TRASH.x,
            coords.TRASH.y + index * CARD_DIMENSIONS.thickness,
            coords.TRASH.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      {/* === CÁC ZONE MỚI ĐƯỢC THÊM VÀO === */}

      {/* SIGNI ZONE */}
      {player.signiZone.map((card, index) => {
        if (!card) return null; // Bỏ qua các ô trống
        const signiCoords = [coords.SIGNI_1, coords.SIGNI_2, coords.SIGNI_3][
          index
        ];
        return (
          <Card
            key={card.uuid}
            card={card}
            position={[signiCoords.x, signiCoords.y, signiCoords.z]}
            rotation={[-Math.PI / 2, 0, 0]} // SIGNI luôn nằm dọc
          />
        );
      })}

      {/* LRIG TRASH */}
      {player.lrigTrash.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.LRIG_TRASH.x,
            coords.LRIG_TRASH.y + index * CARD_DIMENSIONS.thickness,
            coords.LRIG_TRASH.z,
          ]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]} // LRIG trong mộ nằm ngang
        />
      ))}

      {/* CHECK ZONE */}
      {player.checkZone.map((card, index) => {
        // Thông thường chỉ có 1 lá bài trong Check Zone
        if (!card) return null;
        return (
          <Card
            key={card.uuid}
            card={card}
            position={[
              coords.CHECK_ZONE.x,
              coords.CHECK_ZONE.y + index * CARD_DIMENSIONS.thickness,
              coords.CHECK_ZONE.z,
            ]}
            rotation={[-Math.PI / 2, 0, 0]} // Bài trong Check Zone nằm dọc
          />
        );
      })}

      {/* --- VÙNG CLICK ĐỘNG CHO CÁC ZONE (Tùy chọn, thêm sau) --- */}
      {/* (Code cho các <mesh> vô hình có thể được thêm ở đây) */}

      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
