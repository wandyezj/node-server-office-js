import { globalPowerShell } from "../../globalPowerShell";
import {
    MicroCommandPowerShellCloseExcelFile,
    MicroCommandPowerShellCloseExcelFileResult,
} from "./MicroCommand";

export async function runMicroCommandPowerShellCloseExcelFile(
    command: MicroCommandPowerShellCloseExcelFile,
): Promise<MicroCommandPowerShellCloseExcelFileResult> {
    const { id, filePath } = command.parameters;
    await globalPowerShell.closeExcelFile(id, filePath);
    return { success: true };
}
