import { globalLog } from "../../globalLog";
import {
    MicroCommandResultError,
    MicroCommandStartLog,
    MicroCommandStartLogResult,
} from "./MicroCommand";

export function runMicroCommandStartLog(
    command: MicroCommandStartLog,
): MicroCommandStartLogResult | MicroCommandResultError {
    globalLog.startFileLog(command.parameters.filePath);
    return { success: true };
}
