// src/data/assetPreloader.ts

// Các texture tĩnh luôn cần thiết
const staticTextureUrls = [
  "/textures/cardback/MAIN.png",
  "/textures/cardback/LRIG.png",
  "/textures/cardback/PIECE.png",
  "/textures/playmat.png",
];

// Dùng Set để tự động xử lý các URL trùng lặp
const dynamicCardImageUrls = new Set<string>();

/**
 * Thêm một danh sách các URL hình ảnh của lá bài vào hàng đợi preload.
 * @param urls Mảng các chuỗi URL hình ảnh.
 */
export function addCardImageUrlsToPreload(urls: string[]): void {
  for (const url of urls) {
    if (url) {
      // Đảm bảo URL không phải là null hoặc undefined
      dynamicCardImageUrls.add(url);
    }
  }
}

// Mảng này sẽ được component TomiwixossSceneLoader sử dụng.
// Nó là một getter để đảm bảo nó luôn trả về danh sách mới nhất.
export const allTexturePaths = {
  get paths(): string[] {
    return [...staticTextureUrls, ...Array.from(dynamicCardImageUrls)];
  },
};
