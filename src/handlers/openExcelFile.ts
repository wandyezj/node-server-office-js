import * as http from "http";
import { spawn } from "node:child_process";
import { globalProcesses } from "../globalProcesses";
import { getRequestBody } from "./utility/getRequestBody";
import { writeResponseJson } from "./utility/writeResponseJson";
import path from "node:path";
import { addWebExtension } from "./utility/addin";

function getTempFilePath(filePath: string): string {
    const { dir, name, ext } = path.parse(filePath);
    return path.join(dir, `${name}-temp${ext}`);
}

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

    // Create a temp copy of the file with the web extension added.
    const filePathTemp = getTempFilePath(filePath);
    console.log(`Creating temp file with web extension: ${filePathTemp}`);
    addWebExtension(filePath, filePathTemp);
    const openFilePath = filePathTemp;

    // Open the modified file in Excel

    const excelPath = String.raw`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`;
    // Launch Excel with the file
    const excel = spawn(excelPath, [openFilePath], { stdio: "ignore" });
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
