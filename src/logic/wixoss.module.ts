// src/logic/wixoss.module.ts
import gameManager from "./ecs/game.manager";
// Import tất cả các Component của Wixoss
import {
  CardInfoComponent,
  StatusComponent,
  ZoneComponent,
  GlobalStateComponent,
  ActionRequestComponent,
  SideEffectComponent,
  EffectStackComponent,
  UnderneathComponent,
  PowerComponent,
} from "./ecs/components/card.components";

// Import các loop systems (vẫn giữ nguyên)
import { UpSystem } from "./ecs/systems/up.system";
import { DrawSystem } from "./ecs/systems/draw.system";
import { PhaseSystem } from "./ecs/systems/phase.system";
import { SideEffectSystem } from "./ecs/systems/sideEffect.system";

// Import reducers và sagas
import {
  startSetupReducer,
  confirmLrigSelectionReducer,
  updateMulliganSelectionReducer,
  confirmMulliganReducer,
} from "./reducers/setup.reducer";
import { chargeEnerReducer } from "./reducers/ener.reducer";
import { growLrigReducer } from "./reducers/grow.reducer";
import { placeSigniReducer } from "./reducers/placeSigni.reducer";
import { discardCardReducer } from "./reducers/discard.reducer";
import { advancePhaseReducer } from "./reducers/phase.reducer";

import {
  confirmLrigSelectionSaga,
  confirmMulliganSaga,
} from "./sagas/setup.saga";
import { chargeEnerSaga } from "./sagas/ener.saga";
import { growLrigSaga } from "./sagas/grow.saga";
import { placeSigniSaga } from "./sagas/placeSigni.saga";
import { discardCardSaga } from "./sagas/discard.saga";
import { advancePhaseSaga } from "./sagas/phase.saga";

export function registerWixossModule() {
  console.log("--- Registering Wixoss Game Module ---");

  // Đăng ký tất cả các Component
  gameManager.registerComponent("CardInfo", CardInfoComponent);
  gameManager.registerComponent("Status", StatusComponent);
  gameManager.registerComponent("Zone", ZoneComponent);
  gameManager.registerComponent("GlobalState", GlobalStateComponent);
  gameManager.registerComponent("ActionRequest", ActionRequestComponent);
  gameManager.registerComponent("SideEffect", SideEffectComponent);
  gameManager.registerComponent("EffectStack", EffectStackComponent);
  gameManager.registerComponent("Underneath", UnderneathComponent);
  gameManager.registerComponent("Power", PowerComponent);

  // Đăng ký tất cả các Reducer
  gameManager.registerReducer("START_SETUP", startSetupReducer);
  gameManager.registerReducer(
    "CONFIRM_LRIG_SELECTION",
    confirmLrigSelectionReducer
  );
  gameManager.registerReducer(
    "UPDATE_MULLIGAN_SELECTION",
    updateMulliganSelectionReducer
  );
  gameManager.registerReducer("CONFIRM_MULLIGAN", confirmMulliganReducer);
  gameManager.registerReducer("CHARGE_ENER", chargeEnerReducer);
  gameManager.registerReducer("GROW_LRIG", growLrigReducer);
  gameManager.registerReducer("PLACE_SIGNI", placeSigniReducer);
  gameManager.registerReducer("DISCARD_CARD", discardCardReducer);
  gameManager.registerReducer("ADVANCE_PHASE", advancePhaseReducer);

  // Đăng ký tất cả các Sagas
  gameManager.registerSaga("CONFIRM_LRIG_SELECTION", confirmLrigSelectionSaga);
  gameManager.registerSaga("CONFIRM_MULLIGAN", confirmMulliganSaga);
  gameManager.registerSaga("CHARGE_ENER", chargeEnerSaga);
  gameManager.registerSaga("GROW_LRIG", growLrigSaga);
  gameManager.registerSaga("PLACE_SIGNI", placeSigniSaga);
  gameManager.registerSaga("DISCARD_CARD", discardCardSaga);
  gameManager.registerSaga("ADVANCE_PHASE", advancePhaseSaga);

  // Đăng ký các loop systems (vẫn giữ nguyên)
  gameManager.registerSystem(new UpSystem(), "loop");
  gameManager.registerSystem(new DrawSystem(), "loop");
  gameManager.registerSystem(new PhaseSystem(), "loop");
  gameManager.registerSystem(new SideEffectSystem(), "loop");

  // Khởi tạo dependencies
  gameManager.initializeSystems();
}
