import * as http from "http";
import { spawn } from "node:child_process";
import { globalProcesses } from "../globalProcesses";
import { getRequestBody } from "./utility/getRequestBody";
import { writeResponseJson } from "./utility/writeResponseJson";

/**
 *
 * @param request
 * @param response
 */
export async function openExcelFile(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    // Post request
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as { filePath: string }; // e.g. { filePath: "C:\\file.xlsx" }
    const { filePath } = data;

    console.log(`Received request to open Excel file: ${filePath}`);

    const excelPath = String.raw`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`;
    // Launch Excel with the file
    const excel = spawn(excelPath, [filePath], { stdio: "ignore" });
    if (excel.pid === undefined) {
        console.log(`Failed to launch Excel`);
    } else {
        console.log(`Launched Excel with PID: ${excel.pid}`);
    }
    const id = globalProcesses.add(excel);

    writeResponseJson(response, {
        message: "Excel file opened successfully",
        id,
    });
}
