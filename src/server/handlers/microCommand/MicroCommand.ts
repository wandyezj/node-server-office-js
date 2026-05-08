export enum MicroCommandName {
    Console = "Console",
    StartLog = "StartLog",
    EndLog = "EndLog",
    AddinPing = "AddinPing",
    AddinEval = "AddinEval",
    OpenExcelFile = "OpenExcelFile",
    CloseExcelFile = "CloseExcelFile",
    SaveExcelFile = "SaveExcelFile",
    PowerShellOpenExcelFile = "PowerShellOpenExcelFile",
    PowerShellCloseExcelFile = "PowerShellCloseExcelFile",
    PowerShellSaveExcelFile = "PowerShellSaveExcelFile",
    PowerShellSaveActiveWorkbookAs = "PowerShellSaveActiveWorkbookAs",
    ForceCloseExcel = "ForceCloseExcel",
    ReadFileContents = "ReadFileContents",
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

// Aggregates

export interface MicroCommandResultError extends MicroCommandBaseResult {
    success: false;
    error: string;
}

export type MicroCommand =
    | MicroCommandConsole
    | MicroCommandStartLog
    | MicroCommandEndLog
    | MicroCommandAddinPing
    | MicroCommandAddinEval
    | MicroCommandOpenExcelFile
    | MicroCommandCloseExcelFile
    | MicroCommandSaveExcelFile
    | MicroCommandPowerShellOpenExcelFile
    | MicroCommandPowerShellCloseExcelFile
    | MicroCommandPowerShellSaveExcelFile
    | MicroCommandPowerShellSaveActiveWorkbookAs
    | MicroCommandForceCloseExcel
    | MicroCommandReadFileContents;

export type MicroCommandResult =
    | MicroCommandResultError
    | MicroCommandConsoleResult
    | MicroCommandStartLogResult
    | MicroCommandEndLogResult
    | MicroCommandAddinPingResult
    | MicroCommandAddinEvalResult
    | MicroCommandOpenExcelFileResult
    | MicroCommandCloseExcelFileResult
    | MicroCommandSaveExcelFileResult
    | MicroCommandPowerShellOpenExcelFileResult
    | MicroCommandPowerShellCloseExcelFileResult
    | MicroCommandPowerShellSaveExcelFileResult
    | MicroCommandPowerShellSaveActiveWorkbookAsResult
    | MicroCommandForceCloseExcelResult
    | MicroCommandReadFileContentsResult;

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
    metrics: {
        durationMs: number;
    };
}
