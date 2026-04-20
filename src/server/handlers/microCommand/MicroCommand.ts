export enum MicroCommandName {
    Console = "Console",
    AddinPing = "AddinPing",
    AddinEval = "AddinEval",
    OpenExcelFile = "OpenExcelFile",
    CloseExcelFile = "CloseExcelFile",
    SaveExcelFile = "SaveExcelFile",
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
    | MicroCommandSaveExcelFile;

export type MicroCommandResult =
    | MicroCommandResultError
    | MicroCommandConsoleResult
    | MicroCommandAddinPingResult
    | MicroCommandAddinEvalResult
    | MicroCommandOpenExcelFileResult
    | MicroCommandCloseExcelFileResult
    | MicroCommandSaveExcelFileResult;

export interface MicroCommandBody {
    commands: MicroCommand[];
}

export interface MicroCommandBodyResult {
    results: MicroCommandResult[];
}
