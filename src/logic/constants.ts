// src/logic/constants.ts

// Sử dụng `as const` để TypeScript hiểu rằng đây là các giá trị không đổi
// và tạo ra các kiểu chuỗi ký tự (string literal types) thay vì kiểu `string` chung chung.

export const GamePhase = {
  PRE_GAME: "pre_game",
  SELECTING_LRIGS: "selecting_lrigs",
  MULLIGAN: "mulligan",
  UP: "up",
  DRAW: "draw",
  ENER: "ener",
  GROW: "grow",
  MAIN: "main",
  ATTACK: "attack",
  END: "end",
} as const;

export const Zone = {
  MAIN_DECK: "mainDeck",
  LRIG_DECK: "lrigDeck",
  HAND: "hand",
  TRASH: "trash",
  LRIG_TRASH: "lrigTrash",
  LRIG_ZONE: "lrigZone",
  SIGNI_ZONE: "signiZone",
  LIFE_CLOTH: "lifeCloth",
  ENER_ZONE: "enerZone",
  UNDERNEATH: "underneath", // Zone đặc biệt cho các lá bài dưới LRIG
} as const;

export const CardType = {
  LRIG: "LRIG",
  ASSIST_LRIG: "ASSIST LRIG",
  PIECE: "PIECE",
  SIGNI: "SIGNI",
  SPELL: "SPELL",
} as const;

// Tạo ra các kiểu (type) từ các hằng số trên
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
export type Zone = (typeof Zone)[keyof typeof Zone];
export type CardType = (typeof CardType)[keyof typeof CardType];
