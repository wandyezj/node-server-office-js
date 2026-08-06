import { globalLog } from "../../globalLog";
import { MicroCommand, MicroCommandResult, MicroCommandName } from "./MicroCommand";
import { runMicroCommandAddinEval } from "./runMicroCommandAddinEval";
import { runMicroCommandAddinPing } from "./runMicroCommandAddinPing";
import { runMicroCommandOfficeDocumentClose } from "./runMicroCommandOfficeDocumentClose";
import { runMicroCommandCloseExcelFile } from "./runMicroCommandCloseExcelFile";
import { runMicroCommandConsole } from "./runMicroCommandConsole";
import { runMicroCommandDebugger } from "./runMicroCommandDebugger";
import { runMicroCommandEndConsole } from "./runMicroCommandEndConsole";
import { runMicroCommandEndLog } from "./runMicroCommandEndLog";
import { runMicroCommandOfficeDocumentOpen } from "./runMicroCommandOfficeDocumentOpen";
import { runMicroCommandOpenExcelFile } from "./runMicroCommandOpenExcelFile";
import { runMicroCommandSaveExcelFile } from "./runMicroCommandSaveExcelFile";
import { runMicroCommandStartConsole } from "./runMicroCommandStartConsole";
import { runMicroCommandStartLog } from "./runMicroCommandStartLog";
import { runMicroCommandPowerShellOpenExcelFile } from "./runMicroCommandPowerShellOpenExcelFile";
import { runMicroCommandPowerShellSaveExcelFile } from "./runMicroCommandPowerShellSaveExcelFile";
import { runMicroCommandPowerShellCloseExcelFile } from "./runMicroCommandPowerShellCloseExcelFile";
import { runMicroCommandPowerShellSaveActiveWorkbookAs } from "./runMicroCommandPowerShellSaveActiveWorkbookAs";
import { runMicroCommandForceCloseExcel } from "./runMicroCommandForceCloseExcel";
import { runMicroCommandReadFileContents } from "./runMicroCommandReadFileContents";
import { runMicroCommandOfficeDocumentEmbedAddIn } from "./runMicroCommandOfficeDocumentEmbedAddIn";
import { runMicroCommandOfficeDocumentExtractAddIn } from "./runMicroCommandOfficeDocumentExtractAddIn";
import { runMicroCommandMetadataNodeVersion } from "./runMicroCommandMetadataNodeVersion";
import { runMicroCommandMetadataServerVersion } from "./runMicroCommandMetadataServerVersion";
import { runMicroCommandWebsocketServerOpen } from "./runMicroCommandWebsocketServerOpen";
import { runMicroCommandWebsocketServerAwaitConnection } from "./runMicroCommandWebsocketServerAwaitConnection";
import { runMicroCommandWebsocketServerSendMessage } from "./runMicroCommandWebsocketServerSendMessage";
import { runMicroCommandWebsocketServerAwaitMessage } from "./runMicroCommandWebsocketServerAwaitMessage";
import { runMicroCommandWebsocketServerTakeMessages } from "./runMicroCommandWebsocketServerTakeMessages";
import { runMicroCommandWebsocketServerClose } from "./runMicroCommandWebsocketServerClose";

type MicroCommandHandler<Name extends MicroCommandName> = (
    command: Extract<MicroCommand, { name: Name }>,
) => MicroCommandResult | Promise<MicroCommandResult>;

// Keep commands in alphabetical order for easier maintenance.
// prettier-ignore
const microCommandHandlers = {
    [MicroCommandName.AddinEval]: runMicroCommandAddinEval,
    [MicroCommandName.AddinPing]: runMicroCommandAddinPing,
    [MicroCommandName.CloseExcelFile]: runMicroCommandCloseExcelFile,
    [MicroCommandName.Console]: runMicroCommandConsole,
    [MicroCommandName.Debugger]: runMicroCommandDebugger,
    [MicroCommandName.EndConsole]: runMicroCommandEndConsole,
    [MicroCommandName.EndLog]: runMicroCommandEndLog,
    [MicroCommandName.ForceCloseExcel]: runMicroCommandForceCloseExcel,
    [MicroCommandName.MetadataNodeVersion]: runMicroCommandMetadataNodeVersion,
    [MicroCommandName.MetadataServerVersion]: runMicroCommandMetadataServerVersion,
    [MicroCommandName.OfficeDocumentClose]: runMicroCommandOfficeDocumentClose,
    [MicroCommandName.OfficeDocumentEmbedAddIn]: runMicroCommandOfficeDocumentEmbedAddIn,
    [MicroCommandName.OfficeDocumentExtractAddIn]: runMicroCommandOfficeDocumentExtractAddIn,
    [MicroCommandName.OfficeDocumentOpen]: runMicroCommandOfficeDocumentOpen,
    [MicroCommandName.OpenExcelFile]: runMicroCommandOpenExcelFile,
    [MicroCommandName.PowerShellCloseExcelFile]: runMicroCommandPowerShellCloseExcelFile,
    [MicroCommandName.PowerShellOpenExcelFile]: runMicroCommandPowerShellOpenExcelFile,
    [MicroCommandName.PowerShellSaveActiveWorkbookAs]: runMicroCommandPowerShellSaveActiveWorkbookAs,
    [MicroCommandName.PowerShellSaveExcelFile]: runMicroCommandPowerShellSaveExcelFile,
    [MicroCommandName.ReadFileContents]: runMicroCommandReadFileContents,
    [MicroCommandName.SaveExcelFile]: runMicroCommandSaveExcelFile,
    [MicroCommandName.StartConsole]: runMicroCommandStartConsole,
    [MicroCommandName.StartLog]: runMicroCommandStartLog,
    [MicroCommandName.WebsocketServerOpen]: runMicroCommandWebsocketServerOpen,
    [MicroCommandName.WebsocketServerAwaitConnection]: runMicroCommandWebsocketServerAwaitConnection,
    [MicroCommandName.WebsocketServerSendMessage]: runMicroCommandWebsocketServerSendMessage,
    [MicroCommandName.WebsocketServerAwaitMessage]: runMicroCommandWebsocketServerAwaitMessage,
    [MicroCommandName.WebsocketServerTakeMessages]: runMicroCommandWebsocketServerTakeMessages,
    [MicroCommandName.WebsocketServerClose]: runMicroCommandWebsocketServerClose,
} satisfies { [Name in MicroCommandName]: MicroCommandHandler<Name> };

function getMicroCommandHandler<Name extends MicroCommandName>(
    name: Name,
): MicroCommandHandler<Name> {
    return microCommandHandlers[name] as MicroCommandHandler<Name>;
}

export async function runMicroCommand(command: MicroCommand): Promise<MicroCommandResult> {
    const { name } = command;
    globalLog.log(`μ Run micro command: ${name}`, { indent: 1 });

    if (Object.hasOwn(microCommandHandlers, name)) {
        return getMicroCommandHandler(name)(command);
    }

    globalLog.error(`Unknown command: ${name}`);
    return { success: false, error: `Unknown command: ${name}` };
}
