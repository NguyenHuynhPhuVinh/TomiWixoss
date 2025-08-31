// src/logic/ecs/systems/phase.system.ts
import { System, SystemDependencies } from "../ecs.types";
import { World } from "../world";
import {
  ActionRequestComponent,
  GlobalStateComponent,
  ZoneComponent,
  SideEffectComponent,
  EffectStackComponent, // Import EffectStackComponent
} from "../components/card.components";
import { GLOBAL_ENTITY } from "../game.factory";
import { TURN_PHASES, GamePhase } from "@/types/game";
import { GameEvent } from "@/logic/core/events.types";
import { produce } from "immer";

const AUTO_ADVANCE_PHASES: GamePhase[] = ["up", "draw", "ener"];
const INTERACTIVE_PHASES: GamePhase[] = [
  "ener",
  "grow",
  "main",
  "attack",
  "end",
  "selecting_lrigs",
  "mulligan",
];

export class PhaseSystem implements System {
  private gameManager!: SystemDependencies["gameManager"];

  public setup(dependencies: SystemDependencies): void {
    this.gameManager = dependencies.gameManager;
  }

  public update(world: World): World {
    // Không cần produce ở đây vì nó không thay đổi state trực tiếp
    const globalState = world.getComponent<GlobalStateComponent>(
      GLOBAL_ENTITY,
      "GlobalState"
    );
    if (!globalState) return world;

    if (
      AUTO_ADVANCE_PHASES.includes(globalState.phase) &&
      globalState.actionTakenInPhase
    ) {
      console.log(`--- Auto-advancing from ${globalState.phase} ---`);
      // Thay vì tự mình chuyển phase, nó sẽ ra lệnh cho GameManager
      this.gameManager.queueAction({ type: "ADVANCE_PHASE", payload: {} });

      // Để tránh gọi nhiều lần, chúng ta có thể tạm thời set cờ
      // Hoặc tốt hơn là để Reducer xử lý
      // Trong trường hợp này, `advancePhaseReducer` sẽ chạy ở tick tiếp theo
      // và reset `actionTakenInPhase`, ngăn vòng lặp vô tận.
    }

    return world; // Trả về world không thay đổi
  }
}
