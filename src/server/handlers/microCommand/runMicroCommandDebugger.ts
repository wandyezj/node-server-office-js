import { MicroCommandDebugger, MicroCommandDebuggerResult } from "./MicroCommand";

export function runMicroCommandDebugger(
    _command: MicroCommandDebugger,
): MicroCommandDebuggerResult {
    debugger;
    return { success: true };
}
