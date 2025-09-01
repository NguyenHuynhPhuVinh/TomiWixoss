// src/types/game.ts

// === THÊM VÀO ĐẦY ===
// Thêm định nghĩa và export GamePhase tại đây
export type GamePhase =
  | "pre_game"
  | "selecting_lrigs"
  | "mulligan"
  | "up"
  | "draw"
  | "ener"
  | "grow"
  | "main"
  | "attack"
  | "end";

// Thêm TURN_PHASES tại đây
export const TURN_PHASES: GamePhase[] = [
  "up",
  "draw",
  "ener",
  "grow",
  "main",
  "attack",
  "end",
];
// =====================

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

// Định nghĩa cấu trúc cho cost
export interface CardCost {
  [color: string]: number; // Ví dụ: { "Green": 2, "Colorless": 1 }
}

// Định nghĩa cấu trúc cho các kỹ năng
export interface CardAbility {
  type: "Action" | "Auto" | "Enter" | "Const" | "Guard" | "Use Conditions";
  timing?: GamePhase[]; // Thời điểm sử dụng, sử dụng GamePhase để nhất quán
  cost?: CardCost;
  description: string;
  turnLimit?: number; // Giới hạn mỗi lượt
}

// === THÊM ĐỊNH NGHĨA SCRIPT TRIGGER ===
type ScriptTrigger = "onPlay" | "onVanish" | "onAttack" | "onActivate";

// Cấu trúc của một lá bài (đã mở rộng)
export interface CardData {
  id: string; // Mã định danh duy nhất, ví dụ: "WXDi-D01-001"
  name: string;
  type: CardType;
  level?: number;
  limit?: number | string; // Có thể là số hoặc "+1"
  power?: number;
  colors: CardColor[];
  lrigType?: string; // Ví dụ: "At", "Tawil", "Umr"
  team?: string; // Ví dụ: "Ancient Surprise"
  class?: string; // Ví dụ: "Nature Tone: Cosmos"
  growCost?: CardCost;
  cost?: CardCost;
  abilities?: CardAbility[];
  hasBurstIcon?: boolean; // Biểu tượng Burst
  imageUrl: string;
  backType: "MAIN" | "LRIG" | "PIECE";
  isHorizontal?: boolean;
  // === THÊM THUỘC TÍNH MỚI ===
  scripts?: Partial<Record<ScriptTrigger, string>>; // Ví dụ: { onPlay: 'WXDi-D01-013.lua' }
}

// Cấu trúc cho một lá bài trong game (có thêm trạng thái)
export interface CardInstance extends CardData {
  uuid: string;
  isFaceUp: boolean;
  isDowned: boolean;
  owner: "player" | "ai";
  underneathCards?: CardInstance[]; // <-- THÊM DÒNG NÀY
}

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
  | "lrigTrash"
  | "checkZone"
  | "underneath";
