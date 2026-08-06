export enum MicroCommandName {
    Console = "Console",
    Debugger = "Debugger",
    StartConsole = "StartConsole",
    EndConsole = "EndConsole",
    StartLog = "StartLog",
    EndLog = "EndLog",
    AddinPing = "AddinPing",
    AddinEval = "AddinEval",
    OfficeDocumentOpen = "OfficeDocumentOpen",
    OfficeDocumentClose = "OfficeDocumentClose",
    OpenExcelFile = "OpenExcelFile",
    CloseExcelFile = "CloseExcelFile",
    SaveExcelFile = "SaveExcelFile",
    PowerShellOpenExcelFile = "PowerShellOpenExcelFile",
    PowerShellCloseExcelFile = "PowerShellCloseExcelFile",
    PowerShellSaveExcelFile = "PowerShellSaveExcelFile",
    PowerShellSaveActiveWorkbookAs = "PowerShellSaveActiveWorkbookAs",
    ForceCloseExcel = "ForceCloseExcel",
    ReadFileContents = "ReadFileContents",
    OfficeDocumentEmbedAddIn = "OfficeDocumentEmbedAddIn",
    OfficeDocumentExtractAddIn = "OfficeDocumentExtractAddIn",
    MetadataNodeVersion = "MetadataNodeVersion",
    MetadataServerVersion = "MetadataServerVersion",
    WebsocketServerOpen = "WebsocketServerOpen",
    WebsocketServerAwaitConnection = "WebsocketServerAwaitConnection",
    WebsocketServerSendMessage = "WebsocketServerSendMessage",
    WebsocketServerAwaitMessage = "WebsocketServerAwaitMessage",
    WebsocketServerTakeMessages = "WebsocketServerTakeMessages",
    WebsocketServerClose = "WebsocketServerClose",
}

export enum OfficeAppName {
    Excel = "Excel",
    Word = "Word",
    PowerPoint = "PowerPoint",
}

export interface MicroCommandBase {
    /**
     * Mirrored in MicroCommandBaseResult
     */
    id?: string;
}

export interface MicroCommandBaseResult {
    id?: string;
    success: boolean;
}

/**
 * Output the specified message to the console.
 */
export interface MicroCommandConsole extends MicroCommandBase {
    name: MicroCommandName.Console;
    parameters: {
        message: string;
    };
}

export interface MicroCommandConsoleResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Pause server execution when a debugger is attached.
 */
export interface MicroCommandDebugger extends MicroCommandBase {
    name: MicroCommandName.Debugger;
}

export interface MicroCommandDebuggerResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Start writing global logger output to the server console.
 */
export interface MicroCommandStartConsole extends MicroCommandBase {
    name: MicroCommandName.StartConsole;
}

export interface MicroCommandStartConsoleResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Stop writing global logger output to the server console.
 */
export interface MicroCommandEndConsole extends MicroCommandBase {
    name: MicroCommandName.EndConsole;
}

export interface MicroCommandEndConsoleResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Start writing global logger output to the specified file path.
 */
export interface MicroCommandStartLog extends MicroCommandBase {
    name: MicroCommandName.StartLog;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandStartLogResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Stop writing global logger output to a file.
 */
export interface MicroCommandEndLog extends MicroCommandBase {
    name: MicroCommandName.EndLog;
}

export interface MicroCommandEndLogResult extends MicroCommandBaseResult {
    success: true;
}

export interface MicroCommandAddinPing extends MicroCommandBase {
    name: MicroCommandName.AddinPing;
}

export interface MicroCommandAddinPingResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Evaluate JavaScript in the Excel add-in.
 */
export interface MicroCommandAddinEval extends MicroCommandBase {
    name: MicroCommandName.AddinEval;
    parameters: {
        code: string;
    };
}

export interface MicroCommandAddinEvalResult extends MicroCommandBaseResult {
    success: true;
    /**
     * Success means eval worked and returned.
     * Eval can still have an error.
     */
    values: {
        console: string[];
        error?: string;
        result?: any;
    };
}

/**
 * Open an Office app file.
 */
export interface MicroCommandOfficeDocumentOpen extends MicroCommandBase {
    name: MicroCommandName.OfficeDocumentOpen;
    parameters: {
        filePath: string;
        app: OfficeAppName;
    };
}

export interface MicroCommandOfficeDocumentOpenResult extends MicroCommandBaseResult {
    success: true;
    values: {
        id: number | undefined;
    };
}

/**
 * Close an Office app file by process ID or source file path.
 */
export interface MicroCommandOfficeDocumentClose extends MicroCommandBase {
    name: MicroCommandName.OfficeDocumentClose;
    parameters: {
        app: OfficeAppName;
        id?: number;
        filePath?: string;
    };
}

export interface MicroCommandOfficeDocumentCloseResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Open an Excel file with the add-in embedded.
 */
export interface MicroCommandOpenExcelFile extends MicroCommandBase {
    name: MicroCommandName.OpenExcelFile;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandOpenExcelFileResult extends MicroCommandBaseResult {
    success: true;
    values: {
        id: number | undefined;
    };
}

/**
 * Close an Excel file by process ID or source file path.
 */
export interface MicroCommandCloseExcelFile extends MicroCommandBase {
    name: MicroCommandName.CloseExcelFile;
    parameters: {
        id?: number;
        filePath?: string;
    };
}

export interface MicroCommandCloseExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Save the current Excel file contents to the specified file path.
 */
export interface MicroCommandSaveExcelFile extends MicroCommandBase {
    name: MicroCommandName.SaveExcelFile;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandSaveExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Open an Excel file with the add-in embedded, using PowerShell to launch Excel hidden.
 */
export interface MicroCommandPowerShellOpenExcelFile extends MicroCommandBase {
    name: MicroCommandName.PowerShellOpenExcelFile;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandPowerShellOpenExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Close an Excel file by process ID or source file path, using PowerShell.
 */
export interface MicroCommandPowerShellCloseExcelFile extends MicroCommandBase {
    name: MicroCommandName.PowerShellCloseExcelFile;
}

export interface MicroCommandPowerShellCloseExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Save the current Excel file contents to the specified file path (PowerShell variant).
 */
export interface MicroCommandPowerShellSaveExcelFile extends MicroCommandBase {
    name: MicroCommandName.PowerShellSaveExcelFile;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandPowerShellSaveExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Save the active Excel workbook to a new location using PowerShell.
 */
export interface MicroCommandPowerShellSaveActiveWorkbookAs extends MicroCommandBase {
    name: MicroCommandName.PowerShellSaveActiveWorkbookAs;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandPowerShellSaveActiveWorkbookAsResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Force stop all Excel instances running on the machine using PowerShell.
 */
export interface MicroCommandForceCloseExcel extends MicroCommandBase {
    name: MicroCommandName.ForceCloseExcel;
}

export interface MicroCommandForceCloseExcelResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Read the contents of a file from disk.
 */
export interface MicroCommandReadFileContents extends MicroCommandBase {
    name: MicroCommandName.ReadFileContents;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandReadFileContentsResult extends MicroCommandBaseResult {
    success: true;
    values: {
        contents: string;
    };
}

/**
 * Embed the server add-in in an Office document.
 */
export interface MicroCommandOfficeDocumentEmbedAddIn extends MicroCommandBase {
    name: MicroCommandName.OfficeDocumentEmbedAddIn;
    parameters: {
        filePathIn: string;
        filePathOut: string;
        settings: {
            port: number;
        };
    };
}

export interface MicroCommandOfficeDocumentEmbedAddInResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Remove the embedded server add-in from an Office document.
 */
export interface MicroCommandOfficeDocumentExtractAddIn extends MicroCommandBase {
    name: MicroCommandName.OfficeDocumentExtractAddIn;
    parameters: {
        filePathIn: string;
        filePathOut: string;
    };
}

export interface MicroCommandOfficeDocumentExtractAddInResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Return the Node.js version used by the server runtime.
 */
export interface MicroCommandMetadataNodeVersion extends MicroCommandBase {
    name: MicroCommandName.MetadataNodeVersion;
}

export interface MicroCommandMetadataNodeVersionResult extends MicroCommandBaseResult {
    success: true;
    values: {
        version: string;
    };
}

/**
 * Return the server package version.
 */
export interface MicroCommandMetadataServerVersion extends MicroCommandBase {
    name: MicroCommandName.MetadataServerVersion;
}

export interface MicroCommandMetadataServerVersionResult extends MicroCommandBaseResult {
    success: true;
    values: {
        version: string;
    };
}

/**
 * Open a generic websocket server on the specified port.
 */
export interface MicroCommandWebsocketServerOpen extends MicroCommandBase {
    name: MicroCommandName.WebsocketServerOpen;
    parameters: {
        port: number;
    };
}

export interface MicroCommandWebsocketServerOpenResult extends MicroCommandBaseResult {
    success: true;
    values: {
        port: number;
    };
}

/**
 * Wait until a client is connected to a generic websocket server.
 */
export interface MicroCommandWebsocketServerAwaitConnection extends MicroCommandBase {
    name: MicroCommandName.WebsocketServerAwaitConnection;
    parameters: {
        port: number;
        timeoutMs?: number;
    };
}

export interface MicroCommandWebsocketServerAwaitConnectionResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Send a message to all clients connected to a generic websocket server.
 */
export interface MicroCommandWebsocketServerSendMessage extends MicroCommandBase {
    name: MicroCommandName.WebsocketServerSendMessage;
    parameters: {
        port: number;
        message: string;
    };
}

export interface MicroCommandWebsocketServerSendMessageResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Wait until a new message is received and added to the message queue.
 */
export interface MicroCommandWebsocketServerAwaitMessage extends MicroCommandBase {
    name: MicroCommandName.WebsocketServerAwaitMessage;
    parameters: {
        port: number;
        timeoutMs?: number;
    };
}

export interface MicroCommandWebsocketServerAwaitMessageResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Take all queued messages from a generic websocket server.
 */
export interface MicroCommandWebsocketServerTakeMessages extends MicroCommandBase {
    name: MicroCommandName.WebsocketServerTakeMessages;
    parameters: {
        port: number;
    };
}

export interface MicroCommandWebsocketServerTakeMessagesResult extends MicroCommandBaseResult {
    success: true;
    values: {
        port: number;
        messages: string[];
    };
}

/**
 * Close a generic websocket server on the specified port.
 */
export interface MicroCommandWebsocketServerClose extends MicroCommandBase {
    name: MicroCommandName.WebsocketServerClose;
    parameters: {
        port: number;
    };
}

export interface MicroCommandWebsocketServerCloseResult extends MicroCommandBaseResult {
    success: true;
}

// Aggregates

export interface MicroCommandResultError extends MicroCommandBaseResult {
    success: false;
    error: string;
}

// Keep in Alphabetical order for easier maintenance.
export type MicroCommand =
    | MicroCommandConsole
    | MicroCommandDebugger
    | MicroCommandStartConsole
    | MicroCommandEndConsole
    | MicroCommandStartLog
    | MicroCommandEndLog
    | MicroCommandAddinPing
    | MicroCommandAddinEval
    | MicroCommandOfficeDocumentOpen
    | MicroCommandOfficeDocumentClose
    | MicroCommandOpenExcelFile
    | MicroCommandCloseExcelFile
    | MicroCommandSaveExcelFile
    | MicroCommandPowerShellOpenExcelFile
    | MicroCommandPowerShellCloseExcelFile
    | MicroCommandPowerShellSaveExcelFile
    | MicroCommandPowerShellSaveActiveWorkbookAs
    | MicroCommandForceCloseExcel
    | MicroCommandReadFileContents
    | MicroCommandOfficeDocumentEmbedAddIn
    | MicroCommandOfficeDocumentExtractAddIn
    | MicroCommandMetadataNodeVersion
    | MicroCommandMetadataServerVersion
    | MicroCommandWebsocketServerOpen
    | MicroCommandWebsocketServerAwaitConnection
    | MicroCommandWebsocketServerSendMessage
    | MicroCommandWebsocketServerAwaitMessage
    | MicroCommandWebsocketServerTakeMessages
    | MicroCommandWebsocketServerClose;

// Keep in Alphabetical order for easier maintenance.
export type MicroCommandResult =
    | MicroCommandResultError
    | MicroCommandConsoleResult
    | MicroCommandDebuggerResult
    | MicroCommandStartConsoleResult
    | MicroCommandEndConsoleResult
    | MicroCommandStartLogResult
    | MicroCommandEndLogResult
    | MicroCommandAddinPingResult
    | MicroCommandAddinEvalResult
    | MicroCommandOfficeDocumentOpenResult
    | MicroCommandOfficeDocumentCloseResult
    | MicroCommandOpenExcelFileResult
    | MicroCommandCloseExcelFileResult
    | MicroCommandSaveExcelFileResult
    | MicroCommandPowerShellOpenExcelFileResult
    | MicroCommandPowerShellCloseExcelFileResult
    | MicroCommandPowerShellSaveExcelFileResult
    | MicroCommandPowerShellSaveActiveWorkbookAsResult
    | MicroCommandForceCloseExcelResult
    | MicroCommandReadFileContentsResult
    | MicroCommandOfficeDocumentEmbedAddInResult
    | MicroCommandOfficeDocumentExtractAddInResult
    | MicroCommandMetadataNodeVersionResult
    | MicroCommandMetadataServerVersionResult
    | MicroCommandWebsocketServerOpenResult
    | MicroCommandWebsocketServerAwaitConnectionResult
    | MicroCommandWebsocketServerSendMessageResult
    | MicroCommandWebsocketServerAwaitMessageResult
    | MicroCommandWebsocketServerTakeMessagesResult
    | MicroCommandWebsocketServerCloseResult;

export type MicroCommandResultWithMetadata = MicroCommandResult & {
    metrics: {
        durationMs: number;
    };
};

export interface MicroCommandBody {
    commands: MicroCommand[];
}

export interface MicroCommandBodyResult {
    results: MicroCommandResultWithMetadata[];
    /**
     * All micro commands reported success
     */
    success: boolean;
    metrics: {
        durationMs: number;
    };
}
