import { globalLog } from "../../globalLog";
import { MicroCommandResult, MicroCommandBodyResult, MicroCommandBody, MicroCommandResultWithMetadata } from "./MicroCommand";
import { runMicroCommand } from "./runMicroCommand";

export async function runMicroCommandBody(body: MicroCommandBody) {
    const { commands } = body;
    const results: MicroCommandResultWithMetadata[] = [];

    globalLog.indent();
    for (const command of commands) {
        let result: MicroCommandResult;

        // Track MicroCommandDuration
        const startTime = Date.now();
        try {
            result = await runMicroCommand(command);
        } catch (error) {
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

    const resultBody: MicroCommandBodyResult = {
        results,
    };
    return resultBody;
}
