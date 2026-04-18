import * as http from "http";
import { getRequestBody } from "./utility/getRequestBody";
import { globalProcesses, ProcessMetadata } from "../globalProcesses";
import { writeResponseJson } from "./utility/writeResponseJson";
import { writeResponseJsonError } from "./utility/writeResponseJsonError";
import { getAndSaveExcelContents } from "./utility/getAndSaveExcelContents";

/**
 * Close the specific Excel file
 * @param request
 * @param response
 *
 * Closes
 * id - the process ID of the Excel instance to close
 * filePath - the source file path of the Excel file to close
 * overwrite - whether to overwrite the existing file with the modified version.
 */
export async function closeExcelFile(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    // Post request - collect the body stream
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as { id?: number; filePath?: string; filePathSave?: string }; // e.g. { id: 12345 }
    const { id, filePath, filePathSave } = data;

    let targetPid: number | undefined = undefined;
    let targetMetadata: ProcessMetadata | undefined = undefined;

    if (filePath) {
        const allPidMetadata = globalProcesses.getAllPidMetadata();
        for (const [pid, metadata] of allPidMetadata) {
            if (metadata.tag === "excel" && metadata.filePathSource === filePath) {
                targetPid = pid;
                targetMetadata = metadata;
            }
        }
    } else if (id) {
        targetPid = id;
        targetMetadata = globalProcesses.getMetadataByPid(id);
    }

    if (filePathSave) {
        await getAndSaveExcelContents(filePathSave);
    }

    // Close excel file(s)
    if (targetPid === undefined) {
        await globalProcesses.endAllAsync();
        writeResponseJson(response, {
            message: "No ID provided, all Excel files closed successfully",
        });
        return;
    } else {
        await globalProcesses.endByPidAndWait(targetPid);
        writeResponseJson(response, { message: "Excel file closed successfully", id });
    }
}
