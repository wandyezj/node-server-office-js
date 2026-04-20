import { MicroCommandConsole, MicroCommandConsoleResult } from "./MicroCommand";

export function runMicroCommandConsole(command: MicroCommandConsole): MicroCommandConsoleResult {
    console.log(command.parameters.message);
    return { success: true };
}
