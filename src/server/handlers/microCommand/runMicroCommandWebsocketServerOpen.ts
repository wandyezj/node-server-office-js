import { globalWebsocketManager } from "../../globalWebsocketManager";
import {
    MicroCommandWebsocketServerOpen,
    MicroCommandWebsocketServerOpenResult,
} from "./MicroCommand";

export async function runMicroCommandWebsocketServerOpen(
    command: MicroCommandWebsocketServerOpen,
): Promise<MicroCommandWebsocketServerOpenResult> {
    const { port } = command.parameters;
    await globalWebsocketManager.open(port);
    return { success: true, values: { port } };
}
