// src/logic/core/game.api.ts
import useGameStore from "@/store/gameStore"; // Import Zustand store

// Đây là object chứa các hàm mà chúng ta muốn expose cho Lua
export const GameAPI = {
  /**
   * Tăng lượt chơi hiện tại lên 1.
   */
  // increaseTurn: (): void => {
  //   // Gọi action từ Zustand store
  //   useGameStore.getState().increaseTurn();
  //   console.log(
  //     "GameAPI.increaseTurn called. New turn:",
  //     useGameStore.getState().turn
  //   );
  // },
  /**
   * Lấy số lượt hiện tại của game.
   * @returns Số lượt hiện tại.
   */
  // getTurn: (): number => {
  //   return useGameStore.getState().turn;
  // },
  // ... Thêm các hàm khác ở đây sau này, ví dụ:
  // drawCard(playerId, amount)
  // getEntitiesInZone(playerId, zone)
  // ...
};
