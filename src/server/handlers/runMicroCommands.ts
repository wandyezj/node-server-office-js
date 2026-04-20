import * as http from "node:http";
import { globalWebsocket } from "../globalWebsocket";
import { writeResponseJson } from "./utility/writeResponseJson";
import { getRequestBody } from "./utility/getRequestBody";
import {
    MicroCommand,
    MicroCommandAddinPing,
    MicroCommandAddinPingResult,
    MicroCommandBody,
    MicroCommandBodyResult,
    MicroCommandConsole,
    MicroCommandConsoleResult,
    MicroCommandName,
    MicroCommandResult,
    MicroCommandResultError,
} from "./microCommand/MicroCommand";
import { ProtocolMessageType } from "../../addin/ProtocolMessage";
import { globalLog } from "../globalLog";

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

async function runMicroSingleCommand(command: MicroCommand): Promise<MicroCommandResult> {
    const { name } = command;
    globalLog.log(`Run micro command: ${name}`, { indent: 1 });
    switch (name) {
        case MicroCommandName.Console:
            return runMicroCommandConsole(command);
        case MicroCommandName.AddinPing:
            return await runMicroCommandPing(command);
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
