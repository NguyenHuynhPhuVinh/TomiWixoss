// src/store/slices/logSlice.ts
import { StateCreator } from "zustand";
import { GameStore, LogEntry, LogType } from "../types";
import { v4 as uuidv4 } from "uuid";

// Định nghĩa interface cho slice này
// Nó sẽ chứa cả state và action của riêng nó
export interface LogSlice {
  logs: LogEntry[];
  addLog: (logData: Omit<LogEntry, "id" | "timestamp">) => void;
}

// Hàm createLogSlice
// StateCreator<GameStore, [], [], LogSlice> nói với TypeScript rằng:
// - Slice này là một phần của GameStore tổng.
// - Nó không dùng middleware nào.
// - Nó sẽ tạo ra một object có kiểu là LogSlice.
export const createLogSlice: StateCreator<GameStore, [], [], LogSlice> = (
  set
) => ({
  logs: [], // State ban đầu

  // Action
  addLog: (logData) => {
    const newLog: LogEntry = {
      id: uuidv4(),
      ...logData, // Spread object logData vào
      timestamp: Date.now(),
    };

    // Sử dụng hàm `set` được truyền vào
    // `state => ({ ...state, logs: [newLog, ...state.logs] })`
    // Nó sẽ tự động merge kết quả vào state tổng
    set((state) => ({ ...state, logs: [newLog, ...state.logs] }));
  },
});
