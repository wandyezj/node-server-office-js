import { globalWebsocketManager } from "../../globalWebsocketManager";
import {
    MicroCommandWebsocketServerClose,
    MicroCommandWebsocketServerCloseResult,
} from "./MicroCommand";

export async function runMicroCommandWebsocketServerClose(
    command: MicroCommandWebsocketServerClose,
): Promise<MicroCommandWebsocketServerCloseResult> {
    await globalWebsocketManager.close(command.parameters.port);
    return { success: true };
}
