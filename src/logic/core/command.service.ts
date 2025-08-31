// src/logic/core/command.service.ts
import useGameStore from "@/store/gameStore";
import { ICommand } from "../commands/command.interface";

class CommandService {
  public dispatch(command: ICommand): void {
    const { getState, setState } = useGameStore;

    if (command.canExecute(getState)) {
      command.execute(getState, setState);
    } else {
      console.error(
        "Command cannot be executed in the current state.",
        command
      );
      getState().addLog("Hành động không hợp lệ.", "info");
    }
  }
}

const commandService = new CommandService();
export default commandService;
