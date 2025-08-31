// src/data/assetPreloader.ts
import { divaDebutDeckEn } from "./decks/diva-debut-deck-en";

// Lấy tất cả các URL hình ảnh duy nhất từ bộ bài
const cardImageUrls = [
  ...new Set(divaDebutDeckEn.map((card) => card.imageUrl)),
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
