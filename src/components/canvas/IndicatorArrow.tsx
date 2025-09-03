// src/components/canvas/IndicatorArrow.tsx
"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cone } from "@react-three/drei";
import * as THREE from "three";

interface IndicatorArrowProps {
  position: [number, number, number];
}

export default function IndicatorArrow({ position }: IndicatorArrowProps) {
  const arrowRef = useRef<THREE.Mesh>(null!);

  // Sử dụng useFrame để tạo hiệu ứng nhấp nhô
  useFrame(({ clock }) => {
    // Tần số và biên độ của chuyển động
    const frequency = 2;
    const amplitude = 0.15;
    // Vị trí Y ban đầu là vị trí được truyền vào
    const baseY = position[1];
    // Cập nhật vị trí Y của mũi tên theo hàm sin để tạo hiệu ứng mượt mà
    arrowRef.current.position.y =
      baseY + Math.sin(clock.getElapsedTime() * frequency) * amplitude;
  });

  return (
    <group position={position}>
      {/* 
        Sử dụng component Cone từ @react-three/drei để tạo mũi tên.
        Xoay nó 180 độ (Math.PI radians) quanh trục X để nó chỉ xuống.
      */}
      <Cone ref={arrowRef} args={[0.3, 0.6, 8]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial
          color="#00FFFF" // Màu xanh cyan nổi bật
          emissive="#00FFFF" // Tự phát sáng nhẹ để dễ thấy hơn
          emissiveIntensity={0.8}
          toneMapped={false} // Giúp màu emissive không bị ảnh hưởng bởi tone mapping của scene
        />
      </Cone>
    </group>
  );
}
