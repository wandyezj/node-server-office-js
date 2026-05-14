import { globalLog } from "../../globalLog";
import { MicroCommandStartConsole, MicroCommandStartConsoleResult } from "./MicroCommand";

export function runMicroCommandStartConsole(
    _command: MicroCommandStartConsole,
): MicroCommandStartConsoleResult {
    globalLog.startConsole();
    return { success: true };
}
