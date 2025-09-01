// import { GameEvent } from "@/logic/core/events.types";
import luaService from "@/logic/lua/lua.service";
import useGameStore from "@/store/gameStore";

// --- THAY ĐỔI LỚN ---
import { world } from "../world.miniplex";
import { Entity } from "../types.miniplex";
import { GameEvent, GameEventPayloads } from "../../messaging/events.types";
import eventBus from "../../messaging/event.bus";

let isInitialized = false; // <-- Biến cờ

// System bây giờ là một hàm khởi tạo
export function initializeScriptingSystem() {
  if (isInitialized) return; // <-- Ngăn chặn chạy lại
  isInitialized = true;

  console.log("Initializing Scripting System...");
  // Đăng ký lắng nghe các sự kiện game
  eventBus.on(GameEvent.CARD_PLAYED, onCardPlayed);
}

// Handler cho sự kiện card played
async function onCardPlayed(
  payload: GameEventPayloads[GameEvent.CARD_PLAYED]
): Promise<void> {
  const { entityUuid } = payload;

  // Tìm entity trong world
  const entity = Array.from(world.entities).find((e) => e.uuid === entityUuid);
  if (!entity || !entity.cardInfo) return;

  // Kiểm tra xem lá bài này có script cho sự kiện 'onPlay' không
  const scriptFile = entity.cardInfo.data.scripts?.onPlay;
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
