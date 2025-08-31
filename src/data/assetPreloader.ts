// src/data/assetPreloader.ts
// Temporarily commented out until we can load from JSON
// import { divaDebutDeckEn } from "./decks/diva-debut-deck-en";

// Lấy tất cả các URL hình ảnh duy nhất từ bộ bài
// Temporarily use hardcoded paths until JSON loading is implemented
const cardImageUrls: string[] = [
  // Add card image URLs here when available
];

// Thêm các texture tĩnh khác (mặt sau lá bài, playmat)
const otherTextureUrls = [
  "/textures/cardback/MAIN.png",
  "/textures/cardback/LRIG.png",
  "/textures/cardback/PIECE.png",
  "/textures/playmat.png",
];

// Xuất ra danh sách tổng hợp
export const allTexturePaths = [
  ...new Set([...cardImageUrls, ...otherTextureUrls]),
];
