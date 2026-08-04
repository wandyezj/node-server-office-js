import { globalWebsocketManager } from "../../globalWebsocketManager";
import {
    MicroCommandWebsocketServerSendMessage,
    MicroCommandWebsocketServerSendMessageResult,
} from "./MicroCommand";

export function runMicroCommandWebsocketServerSendMessage(
    command: MicroCommandWebsocketServerSendMessage,
): MicroCommandWebsocketServerSendMessageResult {
    const { port, message } = command.parameters;
    globalWebsocketManager.sendMessage(port, message);
    return { success: true };
}
