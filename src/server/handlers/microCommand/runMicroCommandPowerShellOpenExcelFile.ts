import { globalPowerShell } from "../../globalPowerShell";
import { globalWebsocket } from "../../globalWebsocket";
import {
    MicroCommandPowerShellOpenExcelFile,
    MicroCommandPowerShellOpenExcelFileResult,
    MicroCommandResultError,
} from "./MicroCommand";

export async function runMicroCommandPowerShellOpenExcelFile(
    command: MicroCommandPowerShellOpenExcelFile,
): Promise<MicroCommandPowerShellOpenExcelFileResult | MicroCommandResultError> {
    const { filePath } = command.parameters;

    try {
        await globalPowerShell.openExcelFile(filePath);
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}
