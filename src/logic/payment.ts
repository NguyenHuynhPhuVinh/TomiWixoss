// src/logic/payment.ts
import { CardInstance, CardCost } from "@/types/game";

export interface PaymentResult {
  canPay: boolean;
  remainingEner: CardInstance[];
  paidEner: CardInstance[];
}

/**
 * Kiểm tra xem có thể trả một chi phí từ Ener Zone hay không và trả về kết quả.
 * @param cost - Chi phí cần trả (e.g., { Red: 1, Colorless: 2 }).
 * @param enerZone - Mảng các lá bài trong Ener Zone hiện tại.
 * @returns Một object cho biết có thể trả hay không và các mảng Ener tương ứng.
 */
export function checkCost(
  cost: CardCost | undefined,
  enerZone: CardInstance[]
): PaymentResult {
  // --- BƯỚC 1: XỬ LÝ TRƯỜNG HỢP MIỄN PHÍ ---
  if (
    !cost ||
    Object.values(cost).every((val) => val === 0) ||
    Object.keys(cost).length === 0
  ) {
    // Nếu không có cost, hoặc tất cả các giá trị cost đều bằng 0, hoặc cost là object rỗng
    return { canPay: true, remainingEner: enerZone, paidEner: [] };
  }

  // --- BƯỚC 2: LOGIC THANH TOÁN ---
  const tempEnerZone = [...enerZone];
  const paidEner: CardInstance[] = [];
  let canPay = true;

  for (const color in cost) {
    const amount = cost[color];
    if (amount <= 0) continue; // Bỏ qua các cost bằng 0

    for (let i = 0; i < amount; i++) {
      let enerIndex = -1;

      if (color === "Colorless") {
        // Lấy bất kỳ lá nào
        enerIndex = tempEnerZone.findIndex((e) => e);
      } else {
        // Ưu tiên lá có màu chính xác trước
        enerIndex = tempEnerZone.findIndex((e) =>
          e.colors.includes(color as any)
        );
        // Nếu không có, tìm lá Multi Ener
        if (enerIndex === -1) {
          enerIndex = tempEnerZone.findIndex((e) =>
            e.abilities?.some((a) => a.description.includes("[Multi Ener]"))
          );
        }
      }

      if (enerIndex !== -1) {
        paidEner.push(tempEnerZone.splice(enerIndex, 1)[0]);
      } else {
        canPay = false;
        break;
      }
    }
    if (!canPay) break;
  }

  // Nếu không thể trả, trả lại enerZone ban đầu để tránh thay đổi state
  if (!canPay) {
    return { canPay: false, remainingEner: enerZone, paidEner: [] };
  }

  return { canPay: true, remainingEner: tempEnerZone, paidEner };
}
