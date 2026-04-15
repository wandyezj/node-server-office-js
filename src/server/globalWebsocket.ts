import {
    ProtocolMessage,
    ProtocolMessageClientResult,
    ProtocolMessageErrorResult,
    ProtocolMessageEval,
    ProtocolMessageEvalResult,
    ProtocolMessageParameters,
    ProtocolMessagePing,
    ProtocolMessageServerSend,
    ProtocolMessageSource,
    ProtocolMessageType,
} from "../addin/ProtocolMessage";
import { parseJson } from "../utility/parseJson";
import { globalLog } from "./globalLog";

class WebsocketManager {
    #send: (data: string) => void = () => {};
    #sequence: number = 0;

    // Only allow a single resolve reject at a time
    #lastResolveReject:
        | { sequence: number; resolve: (data: any) => void; reject: (data: any) => void }
        | undefined = undefined;

    private getPromise(sequence: number): Promise<any> {
        if (this.#lastResolveReject !== undefined) {
            this.#lastResolveReject.reject(new Error("Another call came in."));
            this.#lastResolveReject = undefined;
        }
        return new Promise((resolve, reject) => {
            this.#lastResolveReject = { sequence, resolve, reject };
        });
    }

    private getSequenceNext(): number {
        this.#sequence++;
        return this.#sequence;
    }

    setSend(send: (data: string) => void): void {
        this.#send = send;
    }

    handleMessage(data: string): void {
        // Handle incoming message
        const result = parseJson<ProtocolMessageClientResult>(data);

        if (!result) {
            console.error("Failed to parse incoming message:", data);
            return;
        }

        const { type, sequence, message } = result;

        console.log(`Websocket Receive: [${sequence}] [${type}] ${message}`);
        globalLog.log(`lastResolveReject sequence: ${this.#lastResolveReject?.sequence}`, {
            indent: 1,
        });

        if (this.#lastResolveReject && this.#lastResolveReject.sequence === sequence) {
            this.#lastResolveReject.resolve(result);
            this.#lastResolveReject = undefined;
        }
    }

    private send(item: ProtocolMessageParameters<ProtocolMessageServerSend>): Promise<any> {
        const sequence = this.getSequenceNext();
        const result = this.getPromise(sequence);
        const { type, message } = item;

        console.log(`Websocket Send: [${sequence}] [${type}] ${message}`);

        const data = JSON.stringify({
            ...item,
            source: ProtocolMessageSource.Server,
            sequence,
        });
        this.#send(data);
        return result;
    }

    async sendPing(): Promise<ProtocolMessageParameters<ProtocolMessagePing>> {
        const message: ProtocolMessageParameters<ProtocolMessagePing> = {
            type: ProtocolMessageType.Ping,
            message: "ping",
        };

        const result = await this.send(message);
        return result;
    }

    async sendEval(code: string): Promise<ProtocolMessageParameters<ProtocolMessageEvalResult>> {
        const message: ProtocolMessageParameters<ProtocolMessageEval> = {
            type: ProtocolMessageType.Eval,
            message: "eval code",
            data: {
                code,
            },
        };

        const result = await this.send(message);
        return result;
    }
}

export const globalWebsocket = new WebsocketManager();
