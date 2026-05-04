import { globalLog } from "../../globalLog";
import {
    MicroCommandResult,
    MicroCommandBodyResult,
    MicroCommandBody,
    MicroCommandResultWithMetadata,
} from "./MicroCommand";
import { runMicroCommand } from "./runMicroCommand";

export async function runMicroCommandBody(body: MicroCommandBody) {
    const { commands } = body;
    const results: MicroCommandResultWithMetadata[] = [];

    // Track total duration
    const startTime = Date.now();

    globalLog.indent();
    for (const command of commands) {
        let result: MicroCommandResult;

        // Track individual MicroCommand duration
        const startTime = Date.now();
        try {
            result = await runMicroCommand(command);
        } catch (error) {
            console.error(error);
            globalLog.error(`μ Micro Command Error:\n${JSON.stringify(error)}`, {
                indentAdjust: 1,
            });
            result = { success: false, error: JSON.stringify(error) };
        }

        const durationMs = Date.now() - startTime;
        results.push({ ...result, metrics: { durationMs } });

        // Stop executing on the first MicroCommand failure.
        if (!result.success) {
            break;
        }
    }
    globalLog.outdent();

    const durationMs = Date.now() - startTime;

    const resultBody: MicroCommandBodyResult = {
        results,
        metrics: {
            durationMs,
        },
    };
    return resultBody;
}
