import { handleEval } from "./handlers/handleEval";
import { handlePing } from "./handlers/handlePing";
import { parseJson } from "../utility/parseJson";
import {
    ProtocolMessageSource,
    ProtocolMessageType,
    ProtocolMessageClientResult,
    ProtocolMessageUnknownResult,
    ProtocolMessageServerSend,
    ProtocolMessageErrorResult,
    ProtocolMessageParameters,
} from "./ProtocolMessage";

async function handleMessageByType(
    message: ProtocolMessageServerSend,
): Promise<ProtocolMessageParameters<ProtocolMessageClientResult>> {
    switch (message.type) {
        case ProtocolMessageType.Ping:
            return await handlePing(message);

        case ProtocolMessageType.Eval:
            // Evaluate the function and return the result
            return await handleEval(message);

        // Any unknown messages
        default: {
            console.error("Unknown message type:", message.type);
            const unsupportedMessage: ProtocolMessageParameters<ProtocolMessageUnknownResult> = {
                type: ProtocolMessageType.UnknownResult,
                message: `Unknown message type: ${message.type}`,
            };
            return unsupportedMessage;
        }
    }
}

export async function handleProtocolMessage(data: string): Promise<ProtocolMessageClientResult> {
    const message = parseJson<ProtocolMessageServerSend>(data);
    if (message === undefined) {
        // Should not be possible
        const unsupportedMessage: ProtocolMessageErrorResult = {
            source: ProtocolMessageSource.Client,
            type: ProtocolMessageType.ErrorResult,
            sequence: undefined,
            message: "Invalid JSON",
        };
        return unsupportedMessage;
    }

    // Validate base fields are present
    const { source, type, sequence } = message;
    if (!(typeof source === "string" && typeof type === "string" && typeof sequence === "number")) {
        const errorMessage: ProtocolMessageErrorResult = {
            source: ProtocolMessageSource.Client,
            type: ProtocolMessageType.ErrorResult,
            sequence: undefined,
            message:
                "Invalid message format, must have: source: string, type: string, and sequence: number",
        };
        return errorMessage;
    }

    function completeMessage<T extends ProtocolMessageClientResult>(
        partialMessage: ProtocolMessageParameters<T>,
    ): T {
        return {
            ...partialMessage,
            source: ProtocolMessageSource.Client,
            sequence,
        } as T;
    }

    // Handle different message types here
    try {
        const result = await handleMessageByType(message);
        return completeMessage(result);
    } catch (e) {
        console.error("Error handling protocol message:", e);
        const errorMessage: ProtocolMessageErrorResult = {
            source: ProtocolMessageSource.Client,
            type: ProtocolMessageType.ErrorResult,
            sequence: message?.sequence,
            message: "Error handling protocol message",
        };
        return errorMessage;
    }
}
