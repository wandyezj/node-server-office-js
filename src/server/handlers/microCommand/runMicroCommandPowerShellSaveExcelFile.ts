import { globalPowerShell } from "../../globalPowerShell";
import {
    MicroCommandPowerShellSaveExcelFile,
    MicroCommandPowerShellSaveExcelFileResult,
} from "./MicroCommand";

export async function runMicroCommandPowerShellSaveExcelFile(
    command: MicroCommandPowerShellSaveExcelFile,
): Promise<MicroCommandPowerShellSaveExcelFileResult> {
    await globalPowerShell.saveExcelFile(command.parameters.filePath);
    return { success: true };
}
