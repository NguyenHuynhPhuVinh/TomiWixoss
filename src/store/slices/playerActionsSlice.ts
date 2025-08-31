// src/store/slices/playerActionsSlice.ts
import { StateCreator } from "zustand";
import { GameStore, PlayerAction } from "../types";
import { CardInstance } from "@/types/game";

// Định nghĩa interface cho slice
export interface PlayerActionsSlice {
  mustDiscard: boolean;
  playerAction: PlayerAction | null;
  upAllCards: () => void;
  discardCardFromHand: (cardUuid: string) => void;
  checkEndPhaseConditions: () => void;
  growCenterLrig: (targetLrigUuid: string) => void;
  growAssistLrig: (targetLrigUuid: string, fromZoneIndex: number) => void;
  initiatePlaceSigni: (cardUuid: string) => void;
  cancelPlayerAction: () => void;
}

// Hàm tạo slice
export const createPlayerActionsSlice: StateCreator<
  GameStore,
  [],
  [],
  PlayerActionsSlice
> = (set, get) => ({
  // State ban đầu
  mustDiscard: false,
  playerAction: null,

  // --- ACTIONS ---
  upAllCards: () => {
    get().addLog("Up toàn bộ bài.", "action");
    set((state) => {
      const upCard = (card: CardInstance | null) =>
        card ? { ...card, isDowned: false } : null;
      return {
        player: {
          ...state.player,
          signiZone: state.player.signiZone.map(upCard),
          lrigZone: state.player.lrigZone.map(upCard),
        },
      };
    });
  },

  discardCardFromHand: (cardUuid: string) => {
    set((state) => {
      const cardToDiscard = state.player.hand.find((c) => c.uuid === cardUuid);
      if (!cardToDiscard) return state;

      const newHand = state.player.hand.filter((c) => c.uuid !== cardUuid);
      // Lá bài bỏ đi sẽ vào Trash và lật ngửa
      cardToDiscard.isFaceUp = true;
      const newTrash = [...state.player.trash, cardToDiscard];

      return {
        player: {
          ...state.player,
          hand: newHand,
          trash: newTrash,
        },
      };
    });
    // Sau khi bỏ bài, gọi hàm kiểm tra lại
    get().checkEndPhaseConditions();
  },

  checkEndPhaseConditions: () => {
    // Action này được gọi sau mỗi lần discard, để kiểm tra xem đã đủ chưa
    const handSize = get().player.hand.length;
    if (handSize <= 6) {
      set({ mustDiscard: false });
    }
  },

  chargeEnerFromHand: (cardUuid: string) => {
    // Các bước kiểm tra điều kiện giữ nguyên
    if (get().actionTakenInPhase) {
      console.warn("Ener Charge action has already been taken this turn.");
      return;
    }
    if (get().phase !== "ener") {
      console.warn("Attempted to charge ener outside of Ener Phase.");
      return;
    }

    // Tìm lá bài TRƯỚC khi set state để có thể log tên của nó
    const cardToCharge = get().player.hand.find((c) => c.uuid === cardUuid);
    if (!cardToCharge) {
      console.error("Card not found in hand to charge ener.");
      return;
    }

    // === THÊM DÒNG LOG CÒN THIẾU Ở ĐÂY ===
    get().addLog(`Nạp Ener từ tay: ${cardToCharge.name}.`, "action");
    // =====================================

    set((state) => {
      // Logic di chuyển bài không cần thay đổi
      const newHand = state.player.hand.filter((c) => c.uuid !== cardUuid);
      cardToCharge.isFaceUp = true;
      const newEnerZone = [...state.player.enerZone, cardToCharge];

      return {
        player: {
          ...state.player,
          hand: newHand,
          enerZone: newEnerZone,
        },
        actionTakenInPhase: true,
      };
    });
  },

  chargeEnerFromSigni: (cardUuid: string, fromZoneIndex: number) => {
    // Các bước kiểm tra điều kiện giữ nguyên
    if (get().actionTakenInPhase) {
      console.warn("Ener Charge action has already been taken this turn.");
      return;
    }
    if (get().phase !== "ener") {
      console.warn("Attempted to charge ener outside of Ener Phase.");
      return;
    }

    // Tìm lá bài TRƯỚC khi set state
    const cardToCharge = get().player.signiZone[fromZoneIndex];
    if (!cardToCharge || cardToCharge.uuid !== cardUuid) {
      console.error("Card not found in SIGNI zone to charge ener.");
      return;
    }

    // === THÊM DÒNG LOG CÒN THIẾU Ở ĐÂY ===
    get().addLog(`Nạp Ener từ sân: ${cardToCharge.name}.`, "action");
    // =====================================

    set((state) => {
      // Logic di chuyển bài không cần thay đổi
      const newSigniZone = [...state.player.signiZone];
      newSigniZone[fromZoneIndex] = null;
      cardToCharge.isFaceUp = true;
      const newEnerZone = [...state.player.enerZone, cardToCharge];

      return {
        player: {
          ...state.player,
          signiZone: newSigniZone,
          enerZone: newEnerZone,
        },
        actionTakenInPhase: true,
      };
    });
  },

  growCenterLrig: (targetLrigUuid: string) => {
    // --- 1. CÁC BƯỚC KIỂM TRA ĐIỀU KIỆN ---
    if (get().phase !== "grow") return;
    if (get().actionTakenInPhase) {
      console.warn("Grow action already taken this turn.");
      return;
    }

    const state = get();
    const targetLrig = state.player.lrigDeck.find(
      (c) => c.uuid === targetLrigUuid
    );
    const currentCenterLrig = state.player.lrigZone[1];

    if (!targetLrig || !currentCenterLrig) {
      console.error("Target LRIG or current Center LRIG not found.");
      return;
    }

    // Kiểm tra Level và LRIG Type
    if (
      targetLrig.level !== (currentCenterLrig.level ?? -1) + 1 ||
      targetLrig.lrigType !== currentCenterLrig.lrigType
    ) {
      console.error("Invalid Grow target: Level or LRIG Type mismatch.");
      return;
    }

    // --- 2. XỬ LÝ THANH TOÁN CHI PHÍ (COST) ---
    const growCost = targetLrig.growCost;
    if (!growCost) {
      console.error("Target LRIG has no Grow Cost defined.");
      return;
    }

    // Tạm thời, chúng ta sẽ có một logic thanh toán đơn giản.
    // Logic này sẽ được cải tiến sau này để người chơi có thể chọn Ener.
    const tempEnerZone = [...state.player.enerZone];
    const paidEner: CardInstance[] = [];
    let canPay = true;

    for (const color in growCost) {
      for (let i = 0; i < growCost[color]; i++) {
        let enerIndex = -1;
        if (color === "Colorless") {
          enerIndex = tempEnerZone.findIndex((e) => e); // Lấy bất kỳ lá nào
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

    if (!canPay) {
      console.error("Cannot pay Grow Cost.", growCost);
      alert("Không đủ Ener để thực hiện Grow!");
      get().addLog(`Không thể Grow: Không đủ Ener.`, "info");
      return;
    }

    // Thêm log trước khi grow
    get().addLog(`Trả ${paidEner.length} Ener.`, "cost");
    get().addLog(`Grow Center LRIG thành ${targetLrig.name}!`, "action");

    // --- 3. CẬP NHẬT STATE SAU KHI MỌI THỨ HỢP LỆ ---
    set((currentState) => {
      // Di chuyển Ener đã trả vào mộ
      const newTrash = [...currentState.player.trash, ...paidEner];

      // Tạo LRIG mới với các lá bài cũ nằm dưới
      const newCenterLrig: CardInstance = {
        ...targetLrig,
        isFaceUp: true,
        underneathCards: [
          currentCenterLrig,
          ...(currentCenterLrig.underneathCards || []),
        ],
      };

      // Cập nhật LRIG Zone
      const newLrigZone = [...currentState.player.lrigZone];
      newLrigZone[1] = newCenterLrig;

      // Xóa LRIG đã dùng khỏi LRIG Deck
      const newLrigDeck = currentState.player.lrigDeck.filter(
        (c) => c.uuid !== targetLrigUuid
      );

      return {
        player: {
          ...currentState.player,
          enerZone: tempEnerZone, // Ener Zone đã bị trừ
          trash: newTrash,
          lrigDeck: newLrigDeck,
          lrigZone: newLrigZone,
        },
        actionTakenInPhase: true,
        isZoneViewerOpen: false, // Tự động đóng modal sau khi Grow thành công
      };
    });
  },

  growAssistLrig: (targetLrigUuid: string, fromZoneIndex: number) => {
    const state = get();
    const targetLrig = state.player.lrigDeck.find(
      (c) => c.uuid === targetLrigUuid
    );
    const currentAssistLrig = state.player.lrigZone[fromZoneIndex];
    const currentCenterLrig = state.player.lrigZone[1]; // Cần để kiểm tra giới hạn level

    // --- 1. KIỂM TRA ĐIỀU KIỆN ---
    if (!targetLrig || !currentAssistLrig || !currentCenterLrig) return;

    const requiredTimings = targetLrig.abilities?.find(
      (a) => a.type === "Enter"
    )?.timing;
    if (requiredTimings && !requiredTimings.includes(state.phase as any)) {
      console.error("Cannot grow Assist LRIG outside of its specified timing.");
      return;
    }

    // Kiểm tra các điều kiện Grow cơ bản
    if (
      targetLrig.level !== (currentAssistLrig.level ?? -1) + 1 ||
      targetLrig.lrigType !== currentAssistLrig.lrigType ||
      targetLrig.level > (currentCenterLrig.level ?? 0)
    ) {
      console.error("Invalid Assist LRIG Grow target.");
      return;
    }

    // --- 2. XỬ LÝ THANH TOÁN COST (Tái sử dụng logic cũ) ---
    // (Phần này giống hệt `growCenterLrig`, bạn có thể tách ra thành hàm helper sau này)
    const growCost = targetLrig.growCost;
    if (!growCost) return;
    const { canPay, tempEnerZone, paidEner } = (() => {
      const tempEnerZone = [...state.player.enerZone];
      const paidEner: CardInstance[] = [];
      let canPay = true;

      for (const color in growCost) {
        for (let i = 0; i < growCost[color]; i++) {
          let enerIndex = -1;
          if (color === "Colorless") {
            enerIndex = tempEnerZone.findIndex((e) => e); // Lấy bất kỳ lá nào
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

      return { canPay, tempEnerZone, paidEner };
    })();

    if (!canPay) {
      console.error("Cannot pay Grow Cost.", growCost);
      alert("Không đủ Ener để thực hiện Grow!");
      get().addLog(`Không thể Grow Assist: Không đủ Ener.`, "info");
      return;
    }

    // Log hành động thành công
    if (paidEner.length > 0) {
      get().addLog(`Trả ${paidEner.length} Ener.`, "cost");
    }
    const side = fromZoneIndex === 0 ? "trái" : "phải";
    get().addLog(
      `Grow Assist LRIG ${side} thành ${targetLrig.name}!`,
      "action"
    );

    // --- 3. CẬP NHẬT STATE ---
    set((currentState) => {
      const newTrash = [...currentState.player.trash, ...paidEner];
      const newAssistLrig: CardInstance = {
        ...targetLrig,
        isFaceUp: true,
        underneathCards: [
          currentAssistLrig,
          ...(currentAssistLrig.underneathCards || []),
        ],
      };
      const newLrigZone = [...currentState.player.lrigZone];
      newLrigZone[fromZoneIndex] = newAssistLrig;
      const newLrigDeck = currentState.player.lrigDeck.filter(
        (c) => c.uuid !== targetLrigUuid
      );

      return {
        player: {
          ...currentState.player,
          enerZone: tempEnerZone,
          trash: newTrash,
          lrigDeck: newLrigDeck,
          lrigZone: newLrigZone,
        },
        // KHÔNG set actionTakenInPhase, vì có thể Grow nhiều lần
        isZoneViewerOpen: false,
        viewingLrigDeckForGrow: null,
      };
    });
  },

  initiatePlaceSigni: (cardUuid) => {
    set({ playerAction: { type: "place_signi", cardUuid } });
  },

  cancelPlayerAction: () => {
    set({ playerAction: null });
  },
});
