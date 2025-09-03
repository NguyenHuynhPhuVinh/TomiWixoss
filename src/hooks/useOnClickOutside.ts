// src/hooks/useOnClickOutside.ts
import { useEffect, RefObject } from "react";

type Handler = (event: MouseEvent | TouchEvent) => void;

// THAY ĐỔI: Chấp nhận một ref đơn hoặc một mảng các ref
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: Handler
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref];

      // Kiểm tra xem cú click có nằm trong bất kỳ ref nào được cung cấp không
      const isClickInside = refs.some(
        (r) => r.current && r.current.contains(event.target as Node)
      );

      if (isClickInside) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
