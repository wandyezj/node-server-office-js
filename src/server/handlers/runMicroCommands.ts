import * as http from "node:http";
import { writeResponseJson } from "./utility/writeResponseJson";
import { getRequestBody } from "./utility/getRequestBody";
import { MicroCommandBody, MicroCommandBodyResult } from "./microCommand/MicroCommand";
import { runMicroCommandBody } from "./microCommand/runMicroCommandBody";

/**
 * Evaluate JavaScript in the Excel add-in.
 * @param request
 * @param response
 */
export async function runMicroCommands(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as MicroCommandBody;

    const resultBody: MicroCommandBodyResult = await runMicroCommandBody(data);

    writeResponseJson(response, resultBody as any);
}
