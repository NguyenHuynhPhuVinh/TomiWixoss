// src/components/canvas/Scene.tsx
"use client";

import { useEffect, useState, Suspense, useMemo } from "react"; // Thêm useState, Suspense, useMemo
import { Canvas, useThree } from "@react-three/fiber"; // Thêm useThree
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Preload, // Thêm Preload
} from "@react-three/drei";
import GameBoard from "./GameBoard";
import Card from "./Card"; // Sẽ dùng AnimatedCard sau
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import { CardInstance } from "@/types/game";
import * as THREE from "three";
import { useSpring, animated } from "@react-spring/three"; // Cài lại @react-spring/three

// --- TẠO COMPONENT CARD CÓ ANIMATION ---
interface AnimatedCardProps {
  card: CardInstance;
  isViewing: boolean;
  deckPosition: [number, number, number];
  deckRotation: [number, number, number];
}

function AnimatedCard({
  card,
  isViewing,
  deckPosition,
  deckRotation,
}: AnimatedCardProps) {
  const { camera } = useThree();

  // Tính toán vị trí/góc xoay mục tiêu
  const target = useMemo(() => {
    if (isViewing) {
      const vec = new THREE.Vector3(0, -0.2, -2.5).unproject(camera);
      const euler = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "XYZ"
      );
      return {
        position: [vec.x, vec.y, vec.z] as [number, number, number],
        rotation: [euler.x, euler.y, euler.z] as [number, number, number],
        scale: 1.8,
      };
    } else {
      return {
        position: deckPosition,
        rotation: deckRotation,
        scale: 1,
      };
    }
  }, [isViewing, camera, deckPosition, deckRotation]);

  // Tạo hiệu ứng spring
  const spring = useSpring({
    to: {
      position: target.position,
      scale: target.scale,
    },
    config: { mass: 1, tension: 200, friction: 25 },
  });

  return (
    <animated.group position={spring.position} scale={spring.scale}>
      <Card card={card} position={[0, 0, 0]} rotation={target.rotation} />
    </animated.group>
  );
}

// --- COMPONENT SCENE CHÍNH ---

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

  // State để quản lý lá bài nào đang được xem
  const [viewingCard, setViewingCard] = useState<CardInstance | null>(null);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleDeckClick = (deck: CardInstance[]) => {
    if (viewingCard) {
      // Nếu đang xem bài, click vào bộ bài sẽ cất bài đi
      setViewingCard(null);
    } else if (deck.length > 0) {
      // Nếu không, lấy lá bài trên cùng để xem
      const topCard = deck[deck.length - 1];
      setViewingCard(topCard);
    }
  };

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
      <OrbitControls minDistance={5} maxDistance={25} />

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

      {/* Vùng click vô hình cho Main Deck */}
      <mesh
        position={[5.2, 0.1, 2.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false} // Vô hình
        onClick={() => handleDeckClick(playerMainDeck)}
      >
        <planeGeometry args={[1, 1.2]} />
      </mesh>

      {/* Render các lá bài của Main Deck */}
      {playerMainDeck.map((card, index) => (
        <AnimatedCard
          key={card.uuid}
          card={card}
          isViewing={viewingCard?.uuid === card.uuid}
          deckPosition={[5.2, 0.01 * index, 2.5]}
          deckRotation={[-Math.PI / 2, 0, 0]} // Góc xoay đúng để nằm úp
        />
      ))}

      {/* Vùng click vô hình cho LRIG Deck */}
      <mesh
        position={[5.2, 0.1, 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={() => handleDeckClick(playerLrigDeck)}
      >
        <planeGeometry args={[1, 1.2]} />
      </mesh>

      {/* Render các lá bài của LRIG Deck */}
      {playerLrigDeck.map((card, index) => (
        <AnimatedCard
          key={card.uuid}
          card={card}
          isViewing={viewingCard?.uuid === card.uuid}
          deckPosition={[5.2, 0.01 * index, 0.5]}
          deckRotation={[-Math.PI / 2, 0, 0]}
        />
      ))}

      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
