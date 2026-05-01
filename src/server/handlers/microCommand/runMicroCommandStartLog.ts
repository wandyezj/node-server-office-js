import { globalLog } from "../../globalLog";
import { MicroCommandStartLog, MicroCommandStartLogResult } from "./MicroCommand";

export function runMicroCommandStartLog(command: MicroCommandStartLog): MicroCommandStartLogResult {
    globalLog.startFileLog(command.parameters.filePath);
    return { success: true };
}
