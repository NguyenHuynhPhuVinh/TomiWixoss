// src/logic/commands/command.interface.ts
import { GameStore } from "@/store/types";

// Lấy ra kiểu của get từ Zustand để truyền vào Command
export type GameStoreGet = () => GameStore;

export interface ICommand {
  /**
   * Kiểm tra xem Command có thể được thực thi trong trạng thái game hiện tại hay không.
   * @param get - Hàm để đọc state hiện tại của game.
   */
  canExecute(get: GameStoreGet): boolean;

  /**
   * Thực thi logic chính của Command.
   * @param get - Hàm để đọc state.
   */
  execute(get: GameStoreGet): void;
}
