import { MicroCommandResult, MicroCommandBodyResult, MicroCommandBody } from "./MicroCommand";
import { runMicroCommand } from "./runMicroCommand";

export async function runMicroCommandBody(body: MicroCommandBody) {
    const { commands } = body;
    const results = [];

    for (const command of commands) {
        let result: MicroCommandResult;
        try {
            result = await runMicroCommand(command);
        } catch (error) {
            result = { success: false, error: JSON.stringify(error) };
        }
        results.push(result);
        if (!result.success) {
            break;
        }
    }

    const resultBody: MicroCommandBodyResult = {
        results,
    };
    return resultBody;
}
