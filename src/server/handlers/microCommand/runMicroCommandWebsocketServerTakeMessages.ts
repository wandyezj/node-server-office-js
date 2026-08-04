import { globalWebsocketManager } from "../../globalWebsocketManager";
import {
    MicroCommandWebsocketServerTakeMessages,
    MicroCommandWebsocketServerTakeMessagesResult,
} from "./MicroCommand";

export function runMicroCommandWebsocketServerTakeMessages(
    command: MicroCommandWebsocketServerTakeMessages,
): MicroCommandWebsocketServerTakeMessagesResult {
    const { port } = command.parameters;
    const messages = globalWebsocketManager.takeMessages(port);
    return { success: true, values: { port, messages } };
}
