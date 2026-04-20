import * as http from "node:http";
import { writeResponseJson } from "./utility/writeResponseJson";
import { getRequestBody } from "./utility/getRequestBody";
import {
    MicroCommandBody,
    MicroCommandBodyResult,
    MicroCommandResult,
} from "./microCommand/MicroCommand";
import { runMicroCommand } from "./microCommand/runMicroCommand";

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

    const { commands } = data;

    const results = [];

    for (const command of commands) {
        let result: MicroCommandResult;
        try {
            result = await runMicroCommand(command);
        } catch (error) {
            result = { success: false, error: JSON.stringify(error) };
        }
        results.push(result);
        if (!result.success) {
            break;
        }
    }

    const resultBody: MicroCommandBodyResult = {
        results,
    };

    writeResponseJson(response, resultBody as any);
}
