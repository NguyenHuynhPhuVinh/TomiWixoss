// src/logic/ecs/systems/scripting.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import { GameEvent } from "@/logic/core/events.types";
import { CardInfoComponent } from "../components/card.components";
import luaService from "@/logic/lua/lua.service";
import useGameStore from "@/store/gameStore";

export class ScriptingSystem implements System {
  private eventBus!: SystemDependencies["eventBus"];

  public setup(dependencies: SystemDependencies): void {
    this.eventBus = dependencies.eventBus;

    // Đăng ký lắng nghe các sự kiện game
    this.eventBus.on(GameEvent.CARD_PLAYED, this.onCardPlayed.bind(this));
    // this.eventBus.on(GameEvent.ATTACK_DECLARED, this.onAttack.bind(this));
    // ... đăng ký các event khác
  }

  // System này không cần hàm update vì nó hoạt động hoàn toàn dựa trên event
  public update(world: World): void {}

  private async onCardPlayed(payload: {
    entityId: number;
    cardId: string;
  }): Promise<void> {
    const world = useGameStore.getState().world;
    if (!world) return;

    const { entityId } = payload;
    const cardInfo = world.getComponent<CardInfoComponent>(
      entityId,
      "CardInfo"
    );

    // Kiểm tra xem lá bài này có script cho sự kiện 'onPlay' không
    const scriptFile = cardInfo?.data.scripts?.onPlay;
    if (!scriptFile) return;

    console.log(
      `%cSCRIPTING: Found 'onPlay' script (${scriptFile}) for card ${payload.cardId}`,
      "color: #9B59B6"
    );

    try {
      // 1. Tải script từ server
      const response = await fetch(`/scripts/cards/${scriptFile}`);
      const scriptContent = await response.text();

      // 2. Thực thi script để load nó vào môi trường Lua
      await luaService.doString(scriptContent);

      // 3. Gọi hàm tương ứng với sự kiện
      // Quy ước: Tên table trong Lua là ID của lá bài (thay '-' bằng '_')
      const tableName = payload.cardId.replace(/-/g, "_");
      const functionCall = `${tableName}.OnEnterField()`; // Quy ước tên hàm

      console.log(
        `%cSCRIPTING: Executing Lua function: ${functionCall}`,
        "color: #9B59B6"
      );
      await luaService.doString(functionCall);
    } catch (error) {
      console.error(`Failed to execute script ${scriptFile}:`, error);
    }
  }
}
