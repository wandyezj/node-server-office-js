import * as http from "http";
import config from "./config.json";
import { FunctionRequestHandler, FunctionRequestMatcher, handleRequest } from "./handleRequest";
import { getMatcher } from "./getMatcher";
import { openExcelFile } from "./handlers/openExcelFile";
import { closeExcelFile } from "./handlers/closeExcelFile";
import { getServeFile } from "./handlers/getServeFile";

console.log("Starting server...");

function gracefulShutdown() {
    console.log("Shutdown signal received. Closing server...");
    process.exit(0);
}

// Ctrl + C
process.on("SIGINT", gracefulShutdown);

function getFile(
    filePath: string,
    contentType: string,
): [FunctionRequestMatcher, FunctionRequestHandler] {
    return [
        getMatcher({ method: "GET", url: `/${filePath}` }),
        getServeFile(filePath, contentType),
    ];
}

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
    // Get Files
    getFile("taskpane.html", "text/html"),
    getFile("icon-16.png", "image/png"),
    getFile("icon-32.png", "image/png"),
    getFile("icon-80.png", "image/png"),
];

let requestCount = 0;

async function handleRequestGeneral(request: http.IncomingMessage, response: http.ServerResponse) {
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
}

//
// Server Setup - http
//
const serverHttp = http.createServer(handleRequestGeneral);

//
// Start Listening on port
//
const port = process.env.PORT || config.port;

console.log(`Server is listening on port ${port}`);

serverHttp.listen(port);

//
// Server Setup - https
//
import * as fs from "node:fs";
import * as https from "https";
import * as path from "path";

if (config.https) {
    // SSL/TLS Credentials
    const certDirectory = path.join(__dirname, "certs");
    const privateKey = fs.readFileSync(path.join(certDirectory, "key.pem"), "utf8");
    const certificate = fs.readFileSync(path.join(certDirectory, "cert.pem"), "utf8");
    const credentials = { key: privateKey, cert: certificate };

    // Create the HTTPS server
    const serverHttps = https.createServer(credentials, handleRequestGeneral);

    const portHttps = config.portHttps;

    console.log(`HTTPS Server is listening on port ${portHttps}`);

    serverHttps.listen(portHttps);
}
