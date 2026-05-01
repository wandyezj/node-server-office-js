import { globalWebsocket } from "../../globalWebsocket";
import { MicroCommandAddinEval, MicroCommandAddinEvalResult } from "./MicroCommand";

export async function runMicroCommandAddinEval(
    command: MicroCommandAddinEval,
): Promise<MicroCommandAddinEvalResult> {
    const evalResult = await globalWebsocket.sendEval(command.parameters.code);
    const { error, result, console: consoleOutput } = evalResult.data;

    return { success: true, values: { console: consoleOutput, result, error } };
}
