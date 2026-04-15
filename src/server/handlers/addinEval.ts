import * as http from "node:http";
import { globalWebsocket } from "../globalWebsocket";
import { writeResponseJson } from "./utility/writeResponseJson";
import { getRequestBody } from "./utility/getRequestBody";
import { writeResponseJsonError } from "./utility/writeResponseJsonError";

/**
 * Evaluate JavaScript in the Excel add-in.
 * @param request
 * @param response
 */
export async function addinEval(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as { code: string }; // e.g. { code: "console.log('Hello, Excel!');" }
    const { code } = data;

    try {
        const result = await globalWebsocket.sendEval(code);
        writeResponseJson(response, result);
    } catch (error) {
        writeResponseJsonError(response, "Failed to evaluate code in Excel add-in", {
            error: (error as Error).message,
        });
    }
}
