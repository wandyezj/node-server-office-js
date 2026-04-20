export enum MicroCommandName {
    Console = "Console",
    AddinPing = "AddinPing",
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

// Aggregates

export interface MicroCommandResultError {
    success: false;
    error: string;
}

export type MicroCommand = MicroCommandConsole | MicroCommandAddinPing;

export type MicroCommandResult =
    | MicroCommandResultError
    | MicroCommandConsoleResult
    | MicroCommandAddinPingResult;

export interface MicroCommandBody {
    commands: MicroCommand[];
}

export interface MicroCommandBodyResult {
    results: MicroCommandResult[];
}
