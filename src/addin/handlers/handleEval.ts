import {
    ProtocolMessageEval,
    ProtocolMessageEvalResult,
    ProtocolMessageParameters,
    ProtocolMessageType,
} from "../ProtocolMessage";

/**
 * Eval and capture any error or console.log
 */
function evalCode(code: string): { error: string | undefined; console: string[] } {
    const consoleMessages: string[] = [];

    const originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
        consoleMessages.push(args.map(String).join(" "));
        originalConsoleLog(...args);
    };

    let error: string | undefined;

    try {
        eval.call(globalThis, code);
    } catch (err) {
        error = (err as Error).message;
    }

    console.log = originalConsoleLog;

    return { error, console: consoleMessages };
}

export async function handleEval(
    message: ProtocolMessageEval,
): Promise<ProtocolMessageParameters<ProtocolMessageEvalResult>> {
    // Evaluate the code in the global scope

    const { code } = message.data;
    if (typeof code !== "string") {
        throw new Error("Invalid code");
    }

    const { error, console: consoleMessages } = evalCode(code);

    const response: ProtocolMessageParameters<ProtocolMessageEvalResult> = {
        type: ProtocolMessageType.EvalResult,
        message: "Eval result",
        data: {
            error,
            console: consoleMessages,
        },
    };
    return response;
}
