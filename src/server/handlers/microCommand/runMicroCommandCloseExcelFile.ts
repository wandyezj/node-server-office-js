import { globalProcesses } from "../../globalProcesses";
import { MicroCommandCloseExcelFile, MicroCommandCloseExcelFileResult } from "./MicroCommand";

export async function runMicroCommandCloseExcelFile(
    command: MicroCommandCloseExcelFile,
): Promise<MicroCommandCloseExcelFileResult> {
    const { id, filePath } = command.parameters;

    let targetPid: number | undefined = undefined;

    if (filePath) {
        for (const [pid, metadata] of globalProcesses.getAllPidMetadata()) {
            if (metadata.tag === "excel" && metadata.filePathSource === filePath) {
                targetPid = pid;
            }
        }
    } else if (id) {
        targetPid = id;
    }

    if (targetPid === undefined) {
        await globalProcesses.endAllAsync();
    } else {
        await globalProcesses.endByPidAndWait(targetPid);
    }

    return { success: true };
}
