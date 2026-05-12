import { globalLog } from "../../globalLog";
import { MicroCommandEndConsole, MicroCommandEndConsoleResult } from "./MicroCommand";

export function runMicroCommandEndConsole(
    _command: MicroCommandEndConsole,
): MicroCommandEndConsoleResult {
    globalLog.endConsole();
    return { success: true };
}