import * as http from "http";
import config from "./config.json";
import { FunctionRequestHandler, FunctionRequestMatcher, handleRequest } from "./handleRequest";
import { getMatcher } from "./getMatcher";
import { openExcelFile } from "./handlers/openExcelFile";
import { closeExcelFile } from "./handlers/closeExcelFile";
import { getTaskpaneHtml } from "./handlers/taskpane";
console.log("Starting server...");

function gracefulShutdown() {
    console.log("Shutdown signal received. Closing server...");
    process.exit(0);
}

// Ctrl + C
process.on("SIGINT", gracefulShutdown);

export const registry: [FunctionRequestMatcher, FunctionRequestHandler][] = [
    [
        // Connectivity check
        getMatcher({ method: "GET", url: "/" }),
        async (request, response) => {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("");
            response.end();
        },
    ],
    [
        // Ping
        getMatcher({ method: "GET", url: "/ping" }),
        async (request, response) => {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("pong");
            response.end();
        },
    ],
    [
        // Open Excel file
        getMatcher({ method: "POST", url: "/open-excel-file" }),
        openExcelFile,
    ],
    [
        // Close Excel file
        getMatcher({ method: "POST", url: "/close-excel-file" }),
        closeExcelFile,
    ],
    [
        // Get taskpane.html
        getMatcher({ method: "GET", url: "/taskpane.html" }),
        getTaskpaneHtml,
    ],
];

let requestCount = 0;

// Server Setup
const server = http.createServer(async (request, response) => {
    const method = request.method;
    const url = request.url;
    //const test = process.env["TEST"];
    const origin = request.headers.origin;

    console.log(`Received request [${requestCount++}]: from ${origin} ${method} ${url}`);
    try {
        await handleRequest(registry, request, response);
    } catch (error) {
        console.error("Error handling request:", error);
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.write("Internal Server Error");
        response.end();
    }
});

//
// Start Listening on port
//
const port = process.env.PORT || config.port;

console.log(`Server is listening on port ${port}`);

server.listen(port);
