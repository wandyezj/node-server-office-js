import * as http from "http";
import { getRequestBody } from "./utility/getRequestBody";
import { globalProcesses } from "../globalProcesses";
import { writeResponseJson } from "./utility/writeResponseJson";

/**
 * Close the specific Excel file
 * @param request
 * @param response
 */
export async function closeExcelFile(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    // Post request - collect the body stream
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as { id: number }; // e.g. { id: 12345 }
    const { id } = data;

    globalProcesses.get(id)?.kill();
    globalProcesses.remove(id);

    // Find the specific excel file

    // Close Excel with the file

    writeResponseJson(response, { message: "Excel file closed successfully", id });
}
