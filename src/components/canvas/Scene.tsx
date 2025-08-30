// src/components/canvas/Scene.tsx
"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card";
import useGameStore from "@/store/gameStore";
import { CardInstance } from "@/types/game";

// === GIẢI PHÁP MỚI ===
import { useStore } from "zustand";

export default function Scene() {
  // === GIẢI PHÁP MỚI ===

  // 1. Lấy ra các state cần thiết bằng cách sử dụng useStore
  //    Pattern: useStore(store, selector)
  const playerMainDeck = useStore(
    useGameStore,
    (state) => state.player.mainDeck
  );
  const playerLrigDeck = useStore(
    useGameStore,
    (state) => state.player.lrigDeck
  );

  // 2. Lấy action ra riêng lẻ vẫn là một good practice
  const initializeGame = useStore(
    useGameStore,
    (state) => state.initializeGame
  );

  // 3. useEffect vẫn giữ nguyên logic guard (chống khởi tạo lại)
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // === KẾT THÚC GIẢI PHÁP ===

  // === KẾT THÚC GIẢI PHÁP ===

  // Khởi tạo game một lần khi component mount
  useEffect(() => {
    // Gọi initializeGame() một lần duy nhất.
    // Chúng ta không cần kiểm tra xem store đã có dữ liệu hay chưa,
    // vì logic này sẽ đảm bảo nó chỉ chạy khi component được tạo.
    initializeGame();
  }, [initializeGame]); // Thêm dependency để tuân thủ quy tắc của ESLint

  const boardWidth = 12;
  // THAY ĐỔI Ở ĐÂY: Cập nhật lại phép tính tỉ lệ
  const boardHeight = boardWidth / (4962 / 3509);

  return (
    <Canvas>
      {/* 1. Điều chỉnh Camera để bao quát cả hai bàn */}
      <PerspectiveCamera makeDefault position={[0, 15, 0.1]} fov={60} />
      <OrbitControls
        minDistance={8}
        maxDistance={25}
        // Giới hạn góc nhìn để không bị lật ngược
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        // Cho phép di chuyển camera song song với bàn đấu
        enablePan={true}
      />

      {/* 2. Ánh sáng và Môi trường */}
      {/* Environment giúp cảnh có ánh sáng và phản chiếu tự nhiên hơn */}
      <Environment preset="city" />
      <ambientLight intensity={1} />
      <directionalLight
        position={[0, 20, 10]}
        intensity={1.5}
        castShadow // Bật đổ bóng
      />

      {/* 3. Bàn đấu của Người chơi 1 (phía dưới) */}
      {/* Loại bỏ 'gap / 2' khỏi phép tính */}
      <GameBoard
        position={[0, 0, boardHeight / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* 4. Bàn đấu của Người chơi 2 (phía trên) */}
      {/* Loại bỏ 'gap / 2' khỏi phép tính */}
      <GameBoard
        position={[0, 0, -(boardHeight / 2)]}
        // Xoay 180 độ quanh trục Y để nó đối diện với người chơi 1
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />

      {/* Render Main Deck của người chơi dựa trên state đã chọn */}
      {playerMainDeck.map((card: CardInstance, index: number) => (
        <Card
          key={card.uuid}
          card={card}
          // Vị trí của Main Deck trên playmat (cần tinh chỉnh tọa độ)
          // Mỗi lá bài chồng lên nhau với một khoảng cách nhỏ
          position={[5.2, 0.01 * index, 2.5]}
          rotation={[0, Math.PI / 2, 0]} // Xoay lá bài để nằm nghiêng
        />
      ))}

      {/* Render LRIG Deck của người chơi */}
      {playerLrigDeck.map((card: CardInstance, index: number) => (
        <Card
          key={card.uuid}
          card={card}
          // Vị trí của LRIG Deck trên playmat (cần tinh chỉnh tọa độ)
          position={[5.2, 0.01 * index, 0.5]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}
    </Canvas>
  );
}
