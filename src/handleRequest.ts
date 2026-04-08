import * as http from "http";

export type FunctionRequestMatcher = (request: http.IncomingMessage) => boolean;

export type FunctionRequestHandler = (
    request: http.IncomingMessage,
    response: http.ServerResponse,
) => void;

export function handleRequest(
    registry: readonly (readonly [FunctionRequestMatcher, FunctionRequestHandler])[],
    request: http.IncomingMessage,
    response: http.ServerResponse,
) {
    for (const [matcher, handler] of registry) {
        if (matcher(request)) {
            console.log(`Matched request: ${request.method} ${request.url}`);
            handler(request, response);
            return; // Stop processing after the first match
        }
    }

    // Default handler if no match found
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("Not Found");
    response.end();
}
