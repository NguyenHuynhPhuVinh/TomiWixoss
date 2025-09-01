// src/components/ui/TomiwixossSceneLoader.tsx
"use client";

import React from "react";
import { useProgress, Html, useTexture } from "@react-three/drei";
// === THAY ĐỔI CÁCH IMPORT ===
import { allTexturePaths } from "@/data/assetPreloader";

// === THAY ĐỔI LOGIC PRELOAD ===
// Dùng hook của Drei để preload tất cả các texture
// Đây chính là "bí mật" của City Builder
function Preloader() {
  // Truy cập vào mảng paths thông qua getter
  useTexture.preload(allTexturePaths.paths);
  return null;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-slate-900 text-white p-8 rounded-lg text-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
        <p className="text-xl font-bold mt-6">
          Đang tải tài nguyên bàn chơi...
        </p>
        <p className="text-2xl font-mono mt-2">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

export const TomiwixossSceneLoader = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Sử dụng Suspense để chờ cho đến khi useTexture.preload hoàn tất
  return (
    <React.Suspense fallback={<Loader />}>
      {/* Component Preloader này sẽ kích hoạt việc tải trước */}
      <Preloader />
      {children}
    </React.Suspense>
  );
};
