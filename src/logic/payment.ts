// src/logic/payment.ts
import { CardInstance } from "@/types/game";

export interface PaymentResult {
  canPay: boolean;
  remainingEner: CardInstance[];
  paidEner: CardInstance[];
}

export function checkCost(
  cost: any, // TODO: Define proper cost type, e.g., { color: string, amount: number }[]
  enerZone: CardInstance[]
): PaymentResult {
  // Tạm thời implement đơn giản: giả sử cost là array of colors or something
  // Trong tương lai, xử lý màu và Multi Ener
  if (cost && cost.length > 0 && enerZone.length >= cost.length) {
    const paidEner = enerZone.slice(0, cost.length);
    const remainingEner = enerZone.slice(cost.length);
    return { canPay: true, remainingEner, paidEner };
  }
  return { canPay: false, remainingEner: enerZone, paidEner: [] };
}
