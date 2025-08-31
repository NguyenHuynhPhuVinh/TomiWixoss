// src/components/canvas/ZoneHelper.tsx
"use client";

import { Box, Text } from "@react-three/drei";

interface ZoneHelperProps {
  position: [number, number, number]; // Tọa độ X, Y, Z
  size: [number, number, number]; // Kích thước Width, Height, Depth
  label: string;
  color?: string;
}

export default function ZoneHelper({
  position,
  size,
  label,
  color = "yellow",
}: ZoneHelperProps) {
  return (
    // Group để chứa cả hộp và text, giúp dễ dàng di chuyển
    <group position={position}>
      {/* Hộp viền để hiển thị ranh giới */}
      <Box args={size}>
        {/*
          Chỉ render wireframe (khung dây) của vật liệu.
          transparent và opacity để làm cho nó trong suốt.
        */}
        <meshBasicMaterial wireframe color={color} />
      </Box>

      {/* Nhãn tên cho khu vực */}
      <Text
        position={[0, size[1] / 2 + 0.2, 0]} // Đặt text ngay trên đỉnh hộp
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]} // Xoay text để nằm phẳng với bàn đấu
      >
        {label}
      </Text>
    </group>
  );
}
