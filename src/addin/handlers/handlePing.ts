import {
    ProtocolMessageParameters,
    ProtocolMessagePing,
    ProtocolMessagePingResult,
    ProtocolMessageType,
} from "../ProtocolMessage";

export async function handlePing(
    message: ProtocolMessagePing,
): Promise<ProtocolMessageParameters<ProtocolMessagePingResult>> {
    return {
        type: ProtocolMessageType.PingResult,
        message: "Pong",
    };
}
