//
// Protocol Message
//
// every message has
//  - source: "client" | "server"
//      - Where the message came from
//  - type: string
//      - distinct type for the message
//  - sequence: number
//      - sequence number of the message
//  - message
//      - readable message for debugging
//  - data
//      - JSON object of actual relevant data

//
// What additional messages do we want to support?
// Evaluation of a function and return of result
// Log trace to server
//

// Client and Server can send each other ping and pong messages

export enum ProtocolMessageSource {
    Client = "Client",
    Server = "Server",
}

/**
 * All possible message types
 */
export enum ProtocolMessageType {
    ErrorResult = "ErrorResult",
    Ping = "Ping",
    PingResult = "PingResult",
    Eval = "Eval",
    EvalResult = "EvalResult",
    Unknown = "Unknown",
    UnknownResult = "UnknownResult",
}

//
// Message State Machine
// Every message should be paired with a result message.
// ErrorResult is returned if the message is unknown.
//
// The sequence number of the response should match the number of the original message.
//

/**
 * Sent from the client to tell the server it's ready
 */
export const ProtocolMessageReady = "ready";

/**
 * Error parsing the message
 */
export interface ProtocolMessageErrorResult {
    type: ProtocolMessageType.ErrorResult;
    source: ProtocolMessageSource.Client;
    sequence: number | undefined;
    message: string;
}

/**
 * Messages that might come from the server but may not be supported on the client.
 */
export interface ProtocolMessageUnknown {
    type: ProtocolMessageType.Unknown;
    source: ProtocolMessageSource.Server;
    sequence: number;
    message: string;
}

export interface ProtocolMessageUnknownResult {
    type: ProtocolMessageType.UnknownResult;
    source: ProtocolMessageSource.Client;
    sequence: number;
    message: string;
}

/**
 * Standard ping
 */
export interface ProtocolMessagePing {
    type: ProtocolMessageType.Ping;
    source: ProtocolMessageSource;
    sequence: number;
    message: string;
}

export interface ProtocolMessagePingResult {
    type: ProtocolMessageType.PingResult;
    source: ProtocolMessageSource;
    sequence: number;
    message: string;
}

/**
 * Run eval on code in global scope
 */
export interface ProtocolMessageEval {
    type: ProtocolMessageType.Eval;
    source: ProtocolMessageSource.Server;
    sequence: number;
    message: string;
    data: {
        code: string;
    };
}

export interface ProtocolMessageEvalResult {
    type: ProtocolMessageType.EvalResult;
    source: ProtocolMessageSource.Client;
    sequence: number;
    message: string;
    data: {
        error?: any;
        /**
         * Result of the evaluated code
         */
        result?: any;
        /**
         * Redirected console.log messages
         */
        console: string[];
    };
}

export type ProtocolMessage =
    | ProtocolMessagePing
    | ProtocolMessagePingResult
    | ProtocolMessageEval
    | ProtocolMessageEvalResult
    | ProtocolMessageUnknown
    | ProtocolMessageUnknownResult
    | ProtocolMessageErrorResult;

export type ProtocolMessageServerSend =
    | ProtocolMessagePing
    | ProtocolMessageEval
    | ProtocolMessageUnknown;

/**
 * All messages that can be returned from the client
 */
export type ProtocolMessageClientResult =
    | ProtocolMessageUnknownResult
    | ProtocolMessageErrorResult
    | ProtocolMessagePingResult
    | ProtocolMessageEvalResult;

export type ProtocolMessageParameters<T extends ProtocolMessage> = Omit<T, "source" | "sequence">;
