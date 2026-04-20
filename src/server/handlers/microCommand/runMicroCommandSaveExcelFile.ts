import { getAndSaveExcelContents } from "../utility/getAndSaveExcelContents";
import { MicroCommandSaveExcelFile, MicroCommandSaveExcelFileResult } from "./MicroCommand";

export async function runMicroCommandSaveExcelFile(
    command: MicroCommandSaveExcelFile,
): Promise<MicroCommandSaveExcelFileResult> {
    await getAndSaveExcelContents(command.parameters.filePath);
    return { success: true };
}
