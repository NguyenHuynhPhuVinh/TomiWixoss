// src/types/game.ts

// Loại lá bài chính
export type CardType = "LRIG" | "ASSIST LRIG" | "SIGNI" | "PIECE" | "SPELL";

// Các màu sắc trong game
export type CardColor =
  | "Green"
  | "Red"
  | "Blue"
  | "White"
  | "Black"
  | "Colorless";

// Cấu trúc của một lá bài
export interface CardData {
  id: string; // Mã định danh duy nhất, ví dụ: "WXDi-D01-001"
  name: string; // Tên lá bài
  type: CardType;
  level?: number; // Level của LRIG/SIGNI
  colors: CardColor[];
  imageUrl: string; // Đường dẫn đến ảnh mặt trước
  backType: "MAIN" | "LRIG" | "PIECE"; // Loại mặt sau để chọn ảnh
  isHorizontal?: boolean; // Đánh dấu nếu là lá bài nằm ngang (PIECE)
  // Thêm các thuộc tính khác sau này: power, abilities, cost...
}

// Cấu trúc cho một lá bài trong game (có thêm trạng thái)
export interface CardInstance extends CardData {
  uuid: string; // ID duy nhất cho instance này trong ván đấu
  isFaceUp: boolean; // Đang úp hay ngửa
  isDowned: boolean; // Đang tapped/downed hay không
  owner: "player" | "ai"; // Thuộc về người chơi nào
}

// Định nghĩa các hành động mà người chơi có thể đang thực hiện
export type PlayerAction =
  | { type: "place_signi"; card: CardInstance }
  | { type: "place_lrig"; card: CardInstance }
  | { type: "charge_ener"; card: CardInstance }
  | { type: "attack"; card: CardInstance };

// Key cho các vùng có thể chứa bài
export type ZoneKey =
  | "mainDeck"
  | "lrigDeck"
  | "hand"
  | "signiZone"
  | "lrigZone"
  | "lifeCloth"
  | "enerZone"
  | "trash"
  | "lrigTrash";
