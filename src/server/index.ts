import { globalLog } from "./globalLog";
import config from "./config.json";
import * as http from "http";
import { handleRequest } from "./handleRequest";
import { WebSocketServer } from "ws";
import { registry } from "./registry";
import { globalWebsocket } from "./globalWebsocket";

globalLog.log("Starting server...");

function gracefulShutdown() {
    globalLog.log("Shutdown signal received. Closing server...");
    process.exit(0);
}

// Ctrl + C
process.on("SIGINT", gracefulShutdown);

let requestCount = 0;

async function handleRequestGeneral(request: http.IncomingMessage, response: http.ServerResponse) {
    const method = request.method;
    const url = request.url;
    //const test = process.env["TEST"];
    const origin = request.headers.origin;

    globalLog.log(`Request Received: [${requestCount++}]: from ${origin} ${method} ${url}`, {indent:0});
    globalLog.indent();
    try {
        await handleRequest(registry, request, response);
    } catch (error) {
        globalLog.error(`Error handling request: ${error}`, {indent:0});
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.write("Internal Server Error");
        response.end();
    }
    globalLog.outdent();
}

//
// Server Setup - http
//
const serverHttp = http.createServer(handleRequestGeneral);

//
// Start Listening on port
//
const port = process.env.PORT || config.http.port;

globalLog.log(`Server [HTTP] is listening on port ${port}`, {indent:0});

serverHttp.listen(port);

//
// Server Setup - https
//
import * as fs from "node:fs";
import * as https from "https";
import * as path from "path";

if (config.https.enabled) {
    // SSL/TLS Credentials
    const certDirectory = path.join(__dirname, "certs");
    const privateKey = fs.readFileSync(path.join(certDirectory, "key.pem"), "utf8");
    const certificate = fs.readFileSync(path.join(certDirectory, "cert.pem"), "utf8");
    const credentials = { key: privateKey, cert: certificate };

    // Create the HTTPS server
    const serverHttps = https.createServer(credentials, handleRequestGeneral);

    const portHttps = config.https.port;

    globalLog.log(`Server [HTTPS] is listening on port ${portHttps}`, {indent:0});

    serverHttps.listen(portHttps);
}


if (config.socket.enabled) {
    const port = config.socket.port;
    const serverWebsocket = new WebSocketServer({ port });

    serverWebsocket.on("connection", function connection(ws) {
        ws.on("error", console.error);

        ws.on("message", async function message(data) {
            globalLog.log(`Websocket received: ${data}`);
            try {
                await globalWebsocket.handleMessage(`${data}`);
            } catch (error) {
                globalLog.error(`Error handling websocket message: ${error}`);
            }
        });

        globalWebsocket.setSend((data: string) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
    });

    globalLog.log(`Server [Socket] running at http://localhost:${port}`, {indent:0});
}
