import { globalWebsocketManager } from "../../globalWebsocketManager";
import {
    MicroCommandWebsocketServerAwaitConnection,
    MicroCommandWebsocketServerAwaitConnectionResult,
} from "./MicroCommand";

export async function runMicroCommandWebsocketServerAwaitConnection(
    command: MicroCommandWebsocketServerAwaitConnection,
): Promise<MicroCommandWebsocketServerAwaitConnectionResult> {
    const { port, timeoutMs } = command.parameters;
    await globalWebsocketManager.awaitConnection(port, timeoutMs);
    return { success: true };
}
