import * as http from "http";
import { spawn } from "node:child_process";
import { globalProcesses } from "../globalProcesses";
import { getRequestBody } from "./utility/getRequestBody";
import { writeResponseJson } from "./utility/writeResponseJson";
import path from "node:path";
//import { addWebExtension } from "./utility/addin";
import { embedAddIn } from "./utility/embedAddin";
import * as fs from "node:fs";
import { globalLog } from "../globalLog";

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

    globalLog.log(`Received request to open Excel file: ${filePath}`);

    // Create a temp copy of the file with the web extension added.
    const filePathTemp = getTempFilePath(filePath);
    globalLog.log(`Creating temp file with web extension: ${filePathTemp}`);

    const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));
    globalLog.log(`manifestPath: ${manifestPath}`);
    embedAddIn(filePath, manifestPath, filePathTemp);
    //addWebExtension(filePath, filePathTemp);
    const openFilePath = filePathTemp;

    // Open the modified file in Excel

    const excelPathBase = String.raw`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPathX86 = String.raw`C:\Program Files (x86)\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPath = fs.existsSync(excelPathBase)
        ? excelPathBase
        : fs.existsSync(excelPathX86)
        ? excelPathX86
        : undefined;

    if (!excelPath) {
        globalLog.log(`Excel executable not found.`);
        writeResponseJson(response, {
            message: "Excel executable not found",
        });
        return;
    }

    // Launch Excel with the file
    const excel = spawn(excelPath, [openFilePath], { stdio: "ignore" });
    if (excel.pid === undefined) {
        globalLog.log(`Failed to launch Excel`);
    } else {
        globalLog.log(`Launched Excel with PID: ${excel.pid}`);
    }
    const id = globalProcesses.add(excel);

    writeResponseJson(response, {
        message: "Excel file opened successfully",
        id,
    });
}
