import { globalProcesses } from "../../globalProcesses";
import {
    MicroCommandOfficeDocumentClose,
    MicroCommandOfficeDocumentCloseResult,
} from "./MicroCommand";

export async function runMicroCommandOfficeDocumentClose(
    command: MicroCommandOfficeDocumentClose,
): Promise<MicroCommandOfficeDocumentCloseResult> {
    const { app, id, filePath } = command.parameters;
    const targetPids: number[] = [];

    for (const [pid, metadata] of globalProcesses.getAllPidMetadata()) {
        if (metadata.tag !== app) {
            continue;
        }

        if (id !== undefined && pid !== id) {
            continue;
        }

        if (filePath !== undefined && metadata.filePathOpen !== filePath) {
            continue;
        }

        targetPids.push(pid);
    }

    await Promise.all(targetPids.map((pid) => globalProcesses.endByPidAndWait(pid)));

    return { success: true };
}
