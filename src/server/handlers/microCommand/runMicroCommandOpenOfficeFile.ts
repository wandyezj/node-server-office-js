import { globalProcesses } from "../../globalProcesses";
import {
    MicroCommandOpenOfficeFile,
    MicroCommandOpenOfficeFileResult,
    MicroCommandResultError,
} from "./MicroCommand";
import { getOfficeAppPath } from "../utility/getOfficeAppPath";

export function runMicroCommandOpenOfficeFile(
    command: MicroCommandOpenOfficeFile,
): MicroCommandOpenOfficeFileResult | MicroCommandResultError {
    const { app, filePath } = command.parameters;

    const appPath = getOfficeAppPath(app);

    if (!appPath) {
        return { success: false, error: `${app} executable not found` };
    }

    const id = globalProcesses.spawn(appPath, [filePath], {
        tag: app,
        filePathSource: filePath,
        filePathOpen: filePath,
    });

    return { success: true, values: { id } };
}
