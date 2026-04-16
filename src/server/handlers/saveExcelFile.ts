import * as http from "node:http";
import { writeResponseJson } from "./utility/writeResponseJson";
import { getRequestBody } from "./utility/getRequestBody";
import { writeResponseJsonError } from "./utility/writeResponseJsonError";
import { globalLog } from "../globalLog";
import { getAndSaveExcelContents } from "./utility/getAndSaveExcelContents";

/**
 * Evaluate JavaScript in the Excel add-in to get the file content and save it to the specified file path
 * @param request
 * @param response
 */
export async function saveExcelFile(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as { filePath: string }; // e.g. { filePath: "C:\\path\\to\\file.xlsx" }
    const { filePath } = data;

    globalLog.log(`Received request to save Excel file: ${filePath}`);

    try {
        await getAndSaveExcelContents(filePath);
        writeResponseJson(response, { message: "Excel file saved successfully" });
    } catch (error) {
        writeResponseJsonError(response, "Failed to evaluate code in Excel add-in", {
            error: (error as Error).message,
        });
    }
}
