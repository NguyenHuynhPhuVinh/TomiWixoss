// src/components/canvas/GameBoard.tsx
"use client";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

export default function GameBoard() {
  // 1. Load ảnh texture như cũ
  const texture = useLoader(TextureLoader, "/textures/playmat.jpg"); // Đổi thành .jpg

  // 2. Tinh chỉnh các thuộc tính của texture để hiển thị sắc nét

  // Anisotropy vẫn là cài đặt quan trọng nhất để chống mờ khi nhìn nghiêng.
  // Giá trị này phụ thuộc vào GPU, nhưng 16 là mức cao và an toàn.
  const maxAnisotropy = 16; // Bạn có thể lấy giá trị max từ renderer nếu muốn, nhưng 16 là đủ tốt.
  texture.anisotropy = maxAnisotropy;

  // Đối với texture NPOT, chúng ta cần đặt wrapping mode thành ClampToEdgeWrapping
  // để ngăn Three.js cố gắng lặp lại texture ở các cạnh.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  // Mipmaps giúp texture trông đẹp hơn khi thu nhỏ. Three.js sẽ tự tạo ra chúng.
  // Chúng ta chỉ cần đảm bảo chế độ lọc sử dụng chúng.
  texture.minFilter = THREE.LinearMipmapLinearFilter; // Lọc chất lượng cao
  texture.magFilter = THREE.LinearFilter; // Lọc khi phóng to

  // Nếu bạn thấy màu sắc của JPG hơi nhạt hoặc sai, hãy bật SRGBColorSpace.
  // Điều này rất phổ biến với các ảnh được lưu từ phần mềm đồ họa.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true; // Báo cho Three.js biết cần cập nhật texture với các cài đặt mới

  // 3. Định nghĩa kích thước bàn đấu dựa trên tỉ lệ ảnh
  const imageAspectRatio = 4961 / 3508; // ~1.4142

  // Chúng ta sẽ đặt chiều rộng của bàn đấu là một giá trị cố định,
  // ví dụ 12 đơn vị trong không gian 3D.
  const boardWidth = 12;

  // Chiều cao sẽ được tính toán tự động để giữ đúng tỉ lệ.
  const boardHeight = boardWidth / imageAspectRatio;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      {/* 4. Sử dụng kích thước đã tính toán cho planeGeometry */}
      <planeGeometry args={[boardWidth, boardHeight]} />

      <meshStandardMaterial
        map={texture}
        // Thêm một chút độ nhám (roughness) để giảm phản xạ ánh sáng chói,
        // giúp texture trông giống một tấm thảm/giấy hơn.
        roughness={0.8}
        // metalness={0} // Không có tính kim loại
      />
    </mesh>
  );
}
