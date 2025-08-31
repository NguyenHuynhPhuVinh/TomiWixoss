// src/store/gameStore.ts
import { create } from "zustand";
import { World } from "@/logic/ecs/world";
import gameManager from "@/logic/ecs/game.manager";

// Định nghĩa lại state
export interface GameStore {
  world: World | null;
  phase: string;
  actionTakenInPhase: boolean;

  // Actions để UI tương tác
  initializeGame: () => void;
  // Các action khác sẽ là các Command
}

const useGameStore = create<GameStore>((set, get) => {
  // Kết nối store với GameManager
  gameManager.onUpdate((updatedWorld) => {
    // Khi GameManager thông báo có cập nhật, chúng ta set lại state
    // Chúng ta không tạo `new World` vì `gameManager` đã làm việc đó.
    // Việc set lại state với cùng một object sẽ không re-render nếu không có thay đổi.
    // Zustand đủ thông minh để so sánh và chỉ re-render khi cần.
    // Tuy nhiên, để chắc chắn, chúng ta có thể tạo một bản sao nông.
    set({ world: { ...updatedWorld } as World });
  });

  return {
    world: null,
    phase: "pre_game",
    actionTakenInPhase: false,

    initializeGame: () => {
      const newWorld = gameManager.createNewGame();
      // Khởi tạo và đồng bộ hóa state lần đầu
      set({
        world: newWorld,
        phase: "selecting_lrigs", // Cập nhật phase ban đầu
      });
    },
  };
});

export default useGameStore;
