import { globalProcesses } from "../../globalProcesses";
import { globalWebsocket } from "../../globalWebsocket";
import {
    MicroCommandOpenExcelFile,
    MicroCommandOpenExcelFileResult,
    MicroCommandResultError,
} from "./MicroCommand";
import { getExcelPath } from "../utility/getExcelPath";
import { getAddinTempExcelFilePath } from "../utility/getAddinTempExcelFilePath";

export async function runMicroCommandOpenExcelFile(
    command: MicroCommandOpenExcelFile,
): Promise<MicroCommandOpenExcelFileResult | MicroCommandResultError> {
    const { filePath } = command.parameters;

    const filePathTemp = getAddinTempExcelFilePath(filePath);

    const excelPath = getExcelPath();

    if (!excelPath) {
        return { success: false, error: "Excel executable not found" };
    }

    const connectionPromise = globalWebsocket.waitForConnection();

    const id = globalProcesses.spawn(excelPath, [filePathTemp], {
        tag: "excel",
        filePathSource: filePath,
        filePathOpen: filePathTemp,
    });

    await connectionPromise;

    return { success: true, id };
}
