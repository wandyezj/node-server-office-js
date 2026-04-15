import { getMatcher } from "./getMatcher";
import { FunctionRequestMatcher, FunctionRequestHandler } from "./handleRequest";
import { closeExcelFile } from "./handlers/closeExcelFile";
import { addinEval } from "./handlers/addinEval";
import { getServeFile } from "./handlers/getServeFile";
import { openExcelFile } from "./handlers/openExcelFile";
import { addinPing } from "./handlers/addinPing";

export function getFile(
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
    [getMatcher({ method: "POST", url: "/addin-ping" }), addinPing],
    [getMatcher({ method: "POST", url: "/addin-eval" }), addinEval],
];
