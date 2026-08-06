import { APIRequestContext, expect } from "@playwright/test";
import {
    MicroCommandBodyResult,
    MicroCommand,
} from "../../src/server/handlers/microCommand/MicroCommand";

export async function runMicroCommandsBase(
    request: APIRequestContext,
    commands: unknown[],
): Promise<MicroCommandBodyResult> {
    const response = await request.post("/run-micro-commands", {
        data: { commands },
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const message = JSON.parse(body) as MicroCommandBodyResult;
    return message;
}

export async function runMicroCommands(
    request: APIRequestContext,
    commands: MicroCommand[],
): Promise<MicroCommandBodyResult> {
    const message = await runMicroCommandsBase(request, commands);
    expect(message.success).toBe(true);
    expect(message.results).toHaveLength(commands.length);
    for (const result of message.results) {
        expect(result.success).toBe(true);
    }

    return message;
}
