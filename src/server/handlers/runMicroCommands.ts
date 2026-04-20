import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { globalWebsocket } from "../globalWebsocket";
import { writeResponseJson } from "./utility/writeResponseJson";
import { getRequestBody } from "./utility/getRequestBody";
import {
    MicroCommand,
    MicroCommandAddinEval,
    MicroCommandAddinEvalResult,
    MicroCommandAddinPing,
    MicroCommandAddinPingResult,
    MicroCommandBody,
    MicroCommandBodyResult,
    MicroCommandCloseExcelFile,
    MicroCommandCloseExcelFileResult,
    MicroCommandConsole,
    MicroCommandConsoleResult,
    MicroCommandName,
    MicroCommandOpenExcelFile,
    MicroCommandOpenExcelFileResult,
    MicroCommandResult,
    MicroCommandResultError,
    MicroCommandSaveExcelFile,
    MicroCommandSaveExcelFileResult,
} from "./microCommand/MicroCommand";
import { ProtocolMessageType } from "../../addin/ProtocolMessage";
import { globalLog } from "../globalLog";
import { globalProcesses } from "../globalProcesses";
import { embedAddIn } from "./utility/embedAddin";
import { getAndSaveExcelContents } from "./utility/getAndSaveExcelContents";

async function runMicroCommandPing(
    command: MicroCommandAddinPing,
): Promise<MicroCommandAddinPingResult | MicroCommandResultError> {
    const pingResult = await globalWebsocket.sendPing();

    const success = pingResult.type === ProtocolMessageType.Ping;

    let result: MicroCommandAddinPingResult | MicroCommandResultError;
    if (success) {
        result = { success };
    } else {
        result = { success: false, error: "Ping failed" };
    }

    return result;
}

function runMicroCommandConsole(command: MicroCommandConsole): MicroCommandConsoleResult {
    console.log(command.parameters.message);
    return { success: true };
}

async function runMicroCommandAddinEval(
    command: MicroCommandAddinEval,
): Promise<MicroCommandAddinEvalResult | MicroCommandResultError> {
    const evalResult = await globalWebsocket.sendEval(command.parameters.code);
    const { error, result, console: consoleOutput } = evalResult.data;

    return { success: true, values: { console: consoleOutput, result, error } };
}

async function runMicroCommandOpenExcelFile(
    command: MicroCommandOpenExcelFile,
): Promise<MicroCommandOpenExcelFileResult | MicroCommandResultError> {
    const { filePath } = command.parameters;

    const { dir, name, ext } = path.parse(filePath);
    const filePathTemp = path.join(dir, `${name}-temp${ext}`);

    const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));
    embedAddIn(filePath, manifestPath, filePathTemp);

    const excelPathBase = String.raw`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPathX86 = String.raw`C:\Program Files (x86)\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPath = fs.existsSync(excelPathBase)
        ? excelPathBase
        : fs.existsSync(excelPathX86)
        ? excelPathX86
        : undefined;

    if (!excelPath) {
        return { success: false, error: "Excel executable not found" };
    }

    const id = globalProcesses.spawn(excelPath, [filePathTemp], {
        tag: "excel",
        filePathSource: filePath,
        filePathOpen: filePathTemp,
    });

    return { success: true, id };
}

async function runMicroCommandCloseExcelFile(
    command: MicroCommandCloseExcelFile,
): Promise<MicroCommandCloseExcelFileResult> {
    const { id, filePath } = command.parameters;

    let targetPid: number | undefined = undefined;

    if (filePath) {
        for (const [pid, metadata] of globalProcesses.getAllPidMetadata()) {
            if (metadata.tag === "excel" && metadata.filePathSource === filePath) {
                targetPid = pid;
            }
        }
    } else if (id) {
        targetPid = id;
    }

    if (targetPid === undefined) {
        await globalProcesses.endAllAsync();
    } else {
        await globalProcesses.endByPidAndWait(targetPid);
    }

    return { success: true };
}

async function runMicroCommandSaveExcelFile(
    command: MicroCommandSaveExcelFile,
): Promise<MicroCommandSaveExcelFileResult> {
    await getAndSaveExcelContents(command.parameters.filePath);
    return { success: true };
}

async function runMicroSingleCommand(command: MicroCommand): Promise<MicroCommandResult> {
    const { name } = command;
    globalLog.log(`Run micro command: ${name}`, { indent: 1 });
    switch (name) {
        case MicroCommandName.Console:
            return runMicroCommandConsole(command);
        case MicroCommandName.AddinPing:
            return await runMicroCommandPing(command);
        case MicroCommandName.AddinEval:
            return await runMicroCommandAddinEval(command);
        case MicroCommandName.OpenExcelFile:
            return await runMicroCommandOpenExcelFile(command);
        case MicroCommandName.CloseExcelFile:
            return await runMicroCommandCloseExcelFile(command);
        case MicroCommandName.SaveExcelFile:
            return await runMicroCommandSaveExcelFile(command);
        default:
            console.warn(`Unknown command: ${name}`);
            return { success: false, error: `Unknown command: ${name}` };
    }
}

/**
 * Evaluate JavaScript in the Excel add-in.
 * @param request
 * @param response
 */
export async function runMicroCommands(
    request: http.IncomingMessage,
    response: http.ServerResponse,
): Promise<void> {
    const body = await getRequestBody(request);
    const data = JSON.parse(body) as MicroCommandBody;

    const { commands } = data;

    const results = [];

    for (const command of commands) {
        let result: MicroCommandResult;
        try {
            result = await runMicroSingleCommand(command);
        } catch (error) {
            result = { success: false, error: JSON.stringify(error) };
        }
        results.push(result);
        if (!result.success) {
            break;
        }
    }

    const resultBody: MicroCommandBodyResult = {
        results,
    };

    writeResponseJson(response, resultBody as any);
}
