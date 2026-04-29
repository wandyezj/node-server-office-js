import { execSync } from "node:child_process";
import { globalLog } from "../../globalLog";
import { MicroCommandForceCloseExcel, MicroCommandForceCloseExcelResult } from "./MicroCommand";

export async function runMicroCommandForceCloseExcel(
    command: MicroCommandForceCloseExcel,
): Promise<MicroCommandForceCloseExcelResult> {
    try {
        const psCommand = "Stop-Process -Name 'Excel' -Force -ErrorAction SilentlyContinue; exit 0";
        const output = execSync(`powershell -Command "${psCommand}"`);
        globalLog.log("Successfully closed all Excel instances", { indent: 2 });
        if (output.toString().trim()) {
            globalLog.log(output.toString().trim(), { indent: 2 });
        }
    } catch (e: any) {
        // If there are no Excel instances running, execSync might still throw
        // depending on PowerShell's strictness. Safely ignore it since the goal is achieved.
        globalLog.log(`Excel instances effectively closed or not running. Details: ${e.message}`, {
            indent: 2,
        });
    }

    return { success: true };
}
