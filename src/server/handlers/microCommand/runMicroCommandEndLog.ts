import { globalLog } from "../../globalLog";
import { MicroCommandEndLog, MicroCommandEndLogResult } from "./MicroCommand";

export function runMicroCommandEndLog(command: MicroCommandEndLog): MicroCommandEndLogResult {
    globalLog.endFileLog();
    return { success: true };
}
