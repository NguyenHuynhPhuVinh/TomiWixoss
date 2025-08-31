// src/logic/effects/effect.system.ts
import eventService, { GameEvent } from "../core/event.service";
import useGameStore from "@/store/gameStore";
import { divaDebutDeckEn } from "@/data/decks/diva-debut-deck-en";
import { DrawCardCommand } from "../commands/drawCard.command";
import commandService from "../core/command.service";

class EffectSystem {
  constructor() {
    this.listenToEvents();
  }

  private listenToEvents() {
    // Lắng nghe sự kiện khi một lá bài được đặt ra sân
    eventService.on(GameEvent.CARD_PLAYED, (payload) => {
      this.handleCardPlayed(payload.cardId);
    });
  }

  private handleCardPlayed(cardId: string) {
    const cardData = divaDebutDeckEn.find((c) => c.id === cardId);
    if (!cardData || !cardData.abilities) return;

    // Tìm các hiệu ứng [Enter]
    const enterAbilities = cardData.abilities.filter((a) => a.type === "Enter");

    for (const ability of enterAbilities) {
      console.log(
        `%c[Enter] Effect Triggered for ${cardData.name}:`,
        "color: #3498DB",
        ability.description
      );

      // === Đây là nơi Strategy Pattern/Lua sẽ được tích hợp ===
      // Tạm thời, chúng ta sẽ hard-code một vài hiệu ứng để minh họa
      if (ability.description.includes("[Ener Charge 3]")) {
        // TODO: Tạo EnerChargeCommand
        useGameStore
          .getState()
          .addLog(`${cardData.name} kích hoạt: Nạp 3 Ener.`, "action");
      }
      if (ability.description.includes("Draw two cards.")) {
        // Ví dụ: Kỹ năng của Umr =Draw=
        // Thay vì gọi trực tiếp, chúng ta dispatch một Command mới
        // (Lưu ý: DrawCardCommand hiện tại chỉ dành cho Draw Phase, cần tạo Command mới hoặc sửa lại)
        useGameStore
          .getState()
          .addLog(`${cardData.name} kích hoạt: Rút 2 lá bài.`, "action");
      }
    }
  }
}

// Khởi tạo hệ thống
const effectSystem = new EffectSystem();
export default effectSystem;
