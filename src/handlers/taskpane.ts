import { readFileSync } from "fs";
import * as http from "http";
import path from "path";

/**
 * Get the taskpane.html file and serve it to the client
 * @param request
 * @param response
 */
export async function getTaskpaneHtml(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    // Read the taskpane.html file from the same directory as the server and serve it
    const data = readFileSync(path.join(__dirname, "taskpane.html"), "utf-8");
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(data);
}
