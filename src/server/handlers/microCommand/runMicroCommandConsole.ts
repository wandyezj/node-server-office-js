import { MicroCommandConsole, MicroCommandConsoleResult } from "./MicroCommand";
import { globalLog } from "../../globalLog";

export function runMicroCommandConsole(command: MicroCommandConsole): MicroCommandConsoleResult {
    globalLog.log(command.parameters.message);
    return { success: true };
}
