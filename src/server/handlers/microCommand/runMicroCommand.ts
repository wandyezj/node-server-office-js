import { globalLog } from "../../globalLog";
import { MicroCommand, MicroCommandResult, MicroCommandName } from "./MicroCommand";
import { runMicroCommandAddinEval } from "./runMicroCommandAddinEval";
import { runMicroCommandAddinPing } from "./runMicroCommandAddinPing";
import { runMicroCommandCloseExcelFile } from "./runMicroCommandCloseExcelFile";
import { runMicroCommandConsole } from "./runMicroCommandConsole";
import { runMicroCommandEndLog } from "./runMicroCommandEndLog";
import { runMicroCommandOpenExcelFile } from "./runMicroCommandOpenExcelFile";
import { runMicroCommandSaveExcelFile } from "./runMicroCommandSaveExcelFile";
import { runMicroCommandStartLog } from "./runMicroCommandStartLog";
import { runMicroCommandPowerShellOpenExcelFile } from "./runMicroCommandPowerShellOpenExcelFile";
import { runMicroCommandPowerShellSaveExcelFile } from "./runMicroCommandPowerShellSaveExcelFile";
import { runMicroCommandPowerShellCloseExcelFile } from "./runMicroCommandPowerShellCloseExcelFile";
import { runMicroCommandPowerShellSaveActiveWorkbookAs } from "./runMicroCommandPowerShellSaveActiveWorkbookAs";
import { runMicroCommandForceCloseExcel } from "./runMicroCommandForceCloseExcel";

export async function runMicroCommand(command: MicroCommand): Promise<MicroCommandResult> {
    const { name } = command;
    globalLog.log(`μ Run micro command: ${name}`, { indent: 1 });
    switch (name) {
        case MicroCommandName.Console:
            return runMicroCommandConsole(command);
        case MicroCommandName.StartLog:
            return runMicroCommandStartLog(command);
        case MicroCommandName.EndLog:
            return runMicroCommandEndLog(command);
        case MicroCommandName.AddinPing:
            return await runMicroCommandAddinPing(command);
        case MicroCommandName.AddinEval:
            return await runMicroCommandAddinEval(command);
        case MicroCommandName.OpenExcelFile:
            return await runMicroCommandOpenExcelFile(command);
        case MicroCommandName.CloseExcelFile:
            return await runMicroCommandCloseExcelFile(command);
        case MicroCommandName.SaveExcelFile:
            return await runMicroCommandSaveExcelFile(command);
        case MicroCommandName.PowerShellOpenExcelFile:
            return await runMicroCommandPowerShellOpenExcelFile(command);
        case MicroCommandName.PowerShellSaveExcelFile:
            return await runMicroCommandPowerShellSaveExcelFile(command);
        case MicroCommandName.PowerShellCloseExcelFile:
            return await runMicroCommandPowerShellCloseExcelFile(command);
        case MicroCommandName.PowerShellSaveActiveWorkbookAs:
            return await runMicroCommandPowerShellSaveActiveWorkbookAs(command);
        case MicroCommandName.ForceCloseExcel:
            return await runMicroCommandForceCloseExcel(command);
        default:
            globalLog.error(`Unknown command: ${name}`);
            return { success: false, error: `Unknown command: ${name}` };
    }
}
