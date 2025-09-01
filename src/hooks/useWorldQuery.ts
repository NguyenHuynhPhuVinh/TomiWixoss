// src/hooks/useWorldQuery.ts
import { useMemo } from "react";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { Entity } from "@/logic/ecs/types.miniplex";

/**
 * Một custom hook để truy vấn dữ liệu từ Miniplex world
 * và tự động re-render component khi world thay đổi.
 * @param queryFn Một hàm nhận vào world và trả về một mảng các entity.
 * @returns Kết quả của query.
 */
export function useWorldQuery<T extends Entity>(queryFn: () => T[]): T[] {
  // Lắng nghe `worldVersion`. Bất cứ khi nào nó thay đổi,
  // component sẽ re-render và hook này sẽ chạy lại.
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);

  // useMemo đảm bảo rằng query chỉ được thực thi lại khi `worldVersion` thay đổi,
  // chứ không phải trên mỗi lần render.
  const entities = useMemo(() => {
    return queryFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldVersion]); // Phụ thuộc vào worldVersion

  return entities;
}
