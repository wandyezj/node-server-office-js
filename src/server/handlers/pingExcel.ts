import * as http from "node:http";
import { globalWebsocket } from "../globalWebsocket";
import { writeResponseJson } from "./utility/writeResponseJson";

/**
 * Ping the Excel add-in to check connectivity.
 * @param request
 * @param response
 */
export async function pingExcel(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    try {
        const result = await globalWebsocket.sendPing();
        writeResponseJson(response, result);
    } catch (error) {
        console.error("Error pinging Excel add-in:", error);
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Failed to ping Excel add-in" }));
    }
}
