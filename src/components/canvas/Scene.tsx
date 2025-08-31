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
// import ZoneHelper from "./ZoneHelper"; // <-- IMPORT HELPER - COMMENTED OUT
import InteractiveZone from "./InteractiveZone";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
// --- IMPORT TỌA ĐỘ ---
import { P1_ZONE_COORDINATES, CARD_DIMENSIONS } from "@/data/zoneCoordinates";

interface SceneProps {
  onMainDeckClick: () => void;
  onLrigDeckClick: () => void;
}

export default function Scene({
  onMainDeckClick,
  onLrigDeckClick,
}: SceneProps) {
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
      {player.mainDeck.length > 0 && ( // Chỉ render vùng click nếu có bài
        <mesh
          // Vị trí của hộp click sẽ được đặt ở giữa chiều cao của chồng bài
          position={[
            coords.MAIN_DECK.x,
            coords.MAIN_DECK.y +
              (player.mainDeck.length * CARD_DIMENSIONS.thickness) / 2,
            coords.MAIN_DECK.z,
          ]}
          onClick={onMainDeckClick}
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
          onClick={onLrigDeckClick}
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
            // Tất cả các lá bài trên sân đều nằm dọc
            rotation={[-Math.PI / 2, 0, 0]}
          />
        );
      })}

      {/* Interactive Zones for LRIG */}
      <InteractiveZone
        isOccupied={!!player.lrigZone[0]}
        position={[coords.ASSIST_LRIG_1.x, 0.1, coords.ASSIST_LRIG_1.z]}
        size={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]}
        zoneKey="lrigZone"
        zoneIndex={0}
      />
      <InteractiveZone
        isOccupied={!!player.lrigZone[1]}
        position={[coords.CENTER_LRIG.x, 0.1, coords.CENTER_LRIG.z]}
        size={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]}
        zoneKey="lrigZone"
        zoneIndex={1}
      />
      <InteractiveZone
        isOccupied={!!player.lrigZone[2]}
        position={[coords.ASSIST_LRIG_2.x, 0.1, coords.ASSIST_LRIG_2.z]}
        size={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]}
        zoneKey="lrigZone"
        zoneIndex={2}
      />

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

      {/* === THÊM CÁC VÙNG CÒN LẠI === */}

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
            rotation={[-Math.PI / 2, 0, 0]}
          />
        );
      })}

      {/* Interactive Zones */}
      <InteractiveZone
        isOccupied={!!player.signiZone[0]}
        position={[coords.SIGNI_1.x, 0.1, coords.SIGNI_1.z]}
        size={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]}
        zoneKey="signiZone"
        zoneIndex={0}
      />
      <InteractiveZone
        isOccupied={!!player.signiZone[1]}
        position={[coords.SIGNI_2.x, 0.1, coords.SIGNI_2.z]}
        size={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]}
        zoneKey="signiZone"
        zoneIndex={1}
      />
      <InteractiveZone
        isOccupied={!!player.signiZone[2]}
        position={[coords.SIGNI_3.x, 0.1, coords.SIGNI_3.z]}
        size={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]}
        zoneKey="signiZone"
        zoneIndex={2}
      />
      {/* Thêm cho LRIG Zone nếu cần */}

      {/* ENER ZONE */}
      {player.enerZone.length > 0 && (
        <mesh
          position={[
            coords.ENER_ZONE.x,
            coords.ENER_ZONE.y +
              (player.enerZone.length * CARD_DIMENSIONS.thickness) / 2,
            coords.ENER_ZONE.z + ((player.enerZone.length - 1) * 0.7) / 2, // Căn giữa theo trục Z
          ]}
          // onClick={() => handleEnerZoneClick()} // Sẽ thêm sau này
        >
          <boxGeometry
            args={[
              CARD_DIMENSIONS.width + 0.1,
              CARD_DIMENSIONS.height + 0.1,
              player.enerZone.length * CARD_DIMENSIONS.thickness +
                (player.enerZone.length - 1) * 0.7, // Chiều sâu động
            ]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
      {/* Các lá bài trong Ener Zone sẽ được xếp chồng lệch sang phải */}
      {player.enerZone.map((card, index) => {
        const totalEnerCards = player.enerZone.length;
        return (
          <Card
            key={card.uuid}
            card={card}
            position={[
              coords.ENER_ZONE.x,
              // === THAY ĐỔI LOGIC TÍNH Y (Z-INDEX) ===
              // Lá bài đầu tiên (index 0) sẽ có Y cao nhất.
              // Lá bài cuối cùng (index = total - 1) sẽ có Y thấp nhất.
              coords.ENER_ZONE.y +
                (totalEnerCards - 1 - index) * CARD_DIMENSIONS.thickness,
              // Logic vị trí Z (giãn cách) không đổi
              coords.ENER_ZONE.z + index * 0.7,
            ]}
            rotation={[
              -Math.PI / 2, // Nằm phẳng
              0,
              Math.PI, // Xoay 180 độ để hướng về đối thủ
            ]}
          />
        );
      })}

      {/* TRASH (Mộ bài chính) */}
      {player.trash.length > 0 && (
        <mesh
          position={[
            coords.TRASH.x,
            coords.TRASH.y +
              (player.trash.length * CARD_DIMENSIONS.thickness) / 2,
            coords.TRASH.z,
          ]}
          // onClick={() => handleTrashClick()} // Sẽ thêm sau này
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

      {/* LRIG TRASH (Mộ bài LRIG) */}
      {player.lrigTrash.length > 0 && (
        <mesh
          position={[
            coords.LRIG_TRASH.x,
            coords.LRIG_TRASH.y +
              (player.lrigTrash.length * CARD_DIMENSIONS.thickness) / 2,
            coords.LRIG_TRASH.z,
          ]}
          // onClick={() => handleLrigTrashClick()} // Sẽ thêm sau này
        >
          <boxGeometry
            args={[
              CARD_DIMENSIONS.height + 0.1, // Nằm ngang
              CARD_DIMENSIONS.width + 0.1, // Nằm ngang
              player.lrigTrash.length * CARD_DIMENSIONS.thickness,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
      {player.lrigTrash.map((card, index) => (
        <Card
          key={card.uuid}
          card={card}
          position={[
            coords.LRIG_TRASH.x,
            coords.LRIG_TRASH.y + index * CARD_DIMENSIONS.thickness,
            coords.LRIG_TRASH.z,
          ]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        />
      ))}

      {/* CHECK ZONE (dùng dữ liệu giả) */}
      {player.checkZone[0] && (
        <Card
          card={player.checkZone[0]}
          position={[
            coords.CHECK_ZONE.x,
            coords.CHECK_ZONE.y,
            coords.CHECK_ZONE.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]} // Nằm dọc
        />
      )}

      {/* === KẾT THÚC THÊM CÁC VÙNG CÒN LẠI === */}

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
