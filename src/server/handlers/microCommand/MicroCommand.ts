export enum MicroCommandName {
    Console = "Console",
    AddinPing = "AddinPing",
    AddinEval = "AddinEval",
    OpenExcelFile = "OpenExcelFile",
    CloseExcelFile = "CloseExcelFile",
    SaveExcelFile = "SaveExcelFile",
    PowerShellOpenExcelFile = "PowerShellOpenExcelFile",
    PowerShellCloseExcelFile = "PowerShellCloseExcelFile",
    PowerShellSaveExcelFile = "PowerShellSaveExcelFile",
    PowerShellSaveActiveWorkbookAs = "PowerShellSaveActiveWorkbookAs",
}

export interface MicroCommandBaseResult {
    success: boolean;
}

/**
 * Output the specified message to the console.
 */
export interface MicroCommandConsole {
    name: MicroCommandName.Console;
    parameters: {
        message: string;
    };
}

export interface MicroCommandConsoleResult extends MicroCommandBaseResult {
    success: true;
}

export interface MicroCommandAddinPing {
    name: MicroCommandName.AddinPing;
}

export interface MicroCommandAddinPingResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Evaluate JavaScript in the Excel add-in.
 */
export interface MicroCommandAddinEval {
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
export interface MicroCommandOpenExcelFile {
    name: MicroCommandName.OpenExcelFile;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandOpenExcelFileResult extends MicroCommandBaseResult {
    success: true;
    id: number | undefined;
}

/**
 * Close an Excel file by process ID or source file path.
 */
export interface MicroCommandCloseExcelFile {
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
export interface MicroCommandSaveExcelFile {
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
export interface MicroCommandPowerShellOpenExcelFile {
    name: MicroCommandName.PowerShellOpenExcelFile;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandPowerShellOpenExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Close an Excel file by process ID or source file path, using PowerShell (taskkill).
 */
export interface MicroCommandPowerShellCloseExcelFile {
    name: MicroCommandName.PowerShellCloseExcelFile;
}

export interface MicroCommandPowerShellCloseExcelFileResult extends MicroCommandBaseResult {
    success: true;
}

/**
 * Save the current Excel file contents to the specified file path (PowerShell variant).
 */
export interface MicroCommandPowerShellSaveExcelFile {
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
export interface MicroCommandPowerShellSaveActiveWorkbookAs {
    name: MicroCommandName.PowerShellSaveActiveWorkbookAs;
    parameters: {
        filePath: string;
    };
}

export interface MicroCommandPowerShellSaveActiveWorkbookAsResult extends MicroCommandBaseResult {
    success: true;
}

// Aggregates

export interface MicroCommandResultError {
    success: false;
    error: string;
}

export type MicroCommand =
    | MicroCommandConsole
    | MicroCommandAddinPing
    | MicroCommandAddinEval
    | MicroCommandOpenExcelFile
    | MicroCommandCloseExcelFile
    | MicroCommandSaveExcelFile
    | MicroCommandPowerShellOpenExcelFile
    | MicroCommandPowerShellCloseExcelFile
    | MicroCommandPowerShellSaveExcelFile
    | MicroCommandPowerShellSaveActiveWorkbookAs;

export type MicroCommandResult =
    | MicroCommandResultError
    | MicroCommandConsoleResult
    | MicroCommandAddinPingResult
    | MicroCommandAddinEvalResult
    | MicroCommandOpenExcelFileResult
    | MicroCommandCloseExcelFileResult
    | MicroCommandSaveExcelFileResult
    | MicroCommandPowerShellOpenExcelFileResult
    | MicroCommandPowerShellCloseExcelFileResult
    | MicroCommandPowerShellSaveExcelFileResult
    | MicroCommandPowerShellSaveActiveWorkbookAsResult;

export interface MicroCommandBody {
    commands: MicroCommand[];
}

export interface MicroCommandBodyResult {
    results: MicroCommandResult[];
}
