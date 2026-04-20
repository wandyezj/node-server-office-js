import { globalWebsocket } from "../../globalWebsocket";
import {
    MicroCommandAddinEval,
    MicroCommandAddinEvalResult,
    MicroCommandResultError,
} from "./MicroCommand";

export async function runMicroCommandAddinEval(
    command: MicroCommandAddinEval,
): Promise<MicroCommandAddinEvalResult | MicroCommandResultError> {
    const evalResult = await globalWebsocket.sendEval(command.parameters.code);
    const { error, result, console: consoleOutput } = evalResult.data;

    return { success: true, values: { console: consoleOutput, result, error } };
}
