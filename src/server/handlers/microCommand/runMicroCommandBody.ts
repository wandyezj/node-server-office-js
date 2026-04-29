import { globalLog } from "../../globalLog";
import { MicroCommandResult, MicroCommandBodyResult, MicroCommandBody } from "./MicroCommand";
import { runMicroCommand } from "./runMicroCommand";

export async function runMicroCommandBody(body: MicroCommandBody) {
    const { commands } = body;
    const results = [];

    globalLog.indent();
    for (const command of commands) {
        let result: MicroCommandResult;
        try {
            result = await runMicroCommand(command);
        } catch (error) {
            globalLog.error(`μ Micro Command Error:\n${JSON.stringify(error)}`, {
                indentAdjust: 1,
            });
            result = { success: false, error: JSON.stringify(error) };
        }
        results.push(result);
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
