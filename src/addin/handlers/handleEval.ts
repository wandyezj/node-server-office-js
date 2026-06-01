import {
    ProtocolMessageEval,
    ProtocolMessageEvalResult,
    ProtocolMessageParameters,
    ProtocolMessageType,
} from "../ProtocolMessage";

function getStringOrEmpty(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }
    return "";
}

/**
 * Eval and capture any error or console.log
 */
async function evalCode(
    code: string,
): Promise<{ error: string | undefined; result: any; console: string[] }> {
    const consoleMessages: string[] = [];

    const originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
        consoleMessages.push(args.map(String).join(" "));
        originalConsoleLog(...args);
    };

    let error: string | undefined;
    let result: any = undefined;
    try {
        // This is the key functionality to allow evaluating arbitrary code.
        /* eslint-disable no-eval */
        result = await eval.call(globalThis, code);
    } catch (e: any) {
        // stringify whatever is received.
        // Specific error formats should be handled in the evaluate code.

        // Special case for Error objects, since these can't always be handled in evaluate code.
        // By default JSON.stringify on an error returns '{}'.
        // If the error is an instance of Error serialize the properties.
        if (e instanceof Error && typeof e.message === "string") {
            const name = getStringOrEmpty(e.name);
            const message = getStringOrEmpty(e.message);
            const stack = getStringOrEmpty(e.stack);

            error = JSON.stringify({
                name,
                message,
                stack,
            });
        } else {
            error = JSON.stringify(e);
        }
    }

    console.log = originalConsoleLog;

    return { error, result, console: consoleMessages };
}

export async function handleEval(
    message: ProtocolMessageEval,
): Promise<ProtocolMessageParameters<ProtocolMessageEvalResult>> {
    // Evaluate the code in the global scope

    const { code } = message.data;
    if (typeof code !== "string") {
        throw new Error("Invalid code");
    }

    const { error, result, console: consoleMessages } = await evalCode(code);

    const response: ProtocolMessageParameters<ProtocolMessageEvalResult> = {
        type: ProtocolMessageType.EvalResult,
        message: "Eval result",
        data: {
            error,
            result,
            console: consoleMessages,
        },
    };
    return response;
}
