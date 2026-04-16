import * as http from "http";

export function writeResponseJsonError(
    response: http.ServerResponse,
    error: string,
    data: Record<string, unknown> = {},
): void {
    const o = { error, data };

    response.writeHead(500, { "Content-Type": "application/json" });
    response.write(JSON.stringify(o));
    response.end();
}
