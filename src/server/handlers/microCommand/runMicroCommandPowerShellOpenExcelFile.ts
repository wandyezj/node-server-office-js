import { globalPowerShell } from "../../globalPowerShell";
import { globalWebsocket } from "../../globalWebsocket";
import {
    MicroCommandPowerShellOpenExcelFile,
    MicroCommandPowerShellOpenExcelFileResult,
} from "./MicroCommand";

export async function runMicroCommandPowerShellOpenExcelFile(
    command: MicroCommandPowerShellOpenExcelFile,
): Promise<MicroCommandPowerShellOpenExcelFileResult> {
    const { filePath } = command.parameters;

    await globalPowerShell.openExcelFile(filePath);
    return { success: true };
}
