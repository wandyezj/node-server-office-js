import { globalWebsocketManager } from "../../globalWebsocketManager";
import {
    MicroCommandWebsocketServerAwaitMessage,
    MicroCommandWebsocketServerAwaitMessageResult,
} from "./MicroCommand";

export async function runMicroCommandWebsocketServerAwaitMessage(
    command: MicroCommandWebsocketServerAwaitMessage,
): Promise<MicroCommandWebsocketServerAwaitMessageResult> {
    const { port, timeoutMs } = command.parameters;
    await globalWebsocketManager.awaitMessage(port, timeoutMs);
    return { success: true };
}
