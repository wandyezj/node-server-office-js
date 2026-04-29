import { globalPowerShell } from "../../globalPowerShell";
import {
    MicroCommandPowerShellCloseExcelFile,
    MicroCommandPowerShellCloseExcelFileResult,
} from "./MicroCommand";

export async function runMicroCommandPowerShellCloseExcelFile(
    command: MicroCommandPowerShellCloseExcelFile,
): Promise<MicroCommandPowerShellCloseExcelFileResult> {
    await globalPowerShell.closeExcelFile();
    return { success: true };
}
