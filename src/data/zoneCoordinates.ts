// src/data/zoneCoordinates.ts
import { CARD_WIDTH, CARD_HEIGHT } from "@/components/canvas/CardModel"; // Import kích thước mới

// Đổi tên để rõ ràng hơn
export const CARD_DIMENSIONS = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  thickness: 0.03, // Giữ nguyên độ dày đã tăng
};

// Tọa độ gốc cho người chơi 1 (phía dưới)
export const P1_ZONE_COORDINATES = {
  SIGNI_1: { x: -2.7, y: 0.01, z: 1.5 },
  SIGNI_2: { x: 0, y: 0.01, z: 1.5 },
  SIGNI_3: { x: 2.7, y: 0.01, z: 1.5 },

  ASSIST_LRIG_1: { x: -2.8, y: 0.01, z: 4.95 },
  CENTER_LRIG: { x: 0, y: 0.01, z: 4.7 },
  ASSIST_LRIG_2: { x: 2.8, y: 0.01, z: 4.95 },

  MAIN_DECK: { x: 5.2, y: 0.01, z: 1.5 },
  TRASH: { x: 6.6, y: 0.01, z: 4.25 },
  LRIG_DECK: { x: 3.75, y: 0.01, z: 7.75 },
  LRIG_TRASH: { x: 6.6, y: 0.01, z: 7.0 },

  ENER_ZONE: { x: -5.2, y: 0.01, z: 2.0 },
  LIFE_CLOTH: { x: -2.7, y: 0.01, z: 7.6 },
  CHECK_ZONE: { x: -5.0, y: 0.01, z: 7.25 },
};

// Hàm helper để lấy tọa độ cho người chơi 2 bằng cách lật ngược
export const getP2ZoneCoordinates = () => {
  const p2Coords: { [key: string]: { x: number; y: number; z: number } } = {};
  for (const key in P1_ZONE_COORDINATES) {
    p2Coords[key] = {
      x: -P1_ZONE_COORDINATES[key as keyof typeof P1_ZONE_COORDINATES].x,
      y: P1_ZONE_COORDINATES[key as keyof typeof P1_ZONE_COORDINATES].y,
      z: -P1_ZONE_COORDINATES[key as keyof typeof P1_ZONE_COORDINATES].z,
    };
  }
  return p2Coords;
};
