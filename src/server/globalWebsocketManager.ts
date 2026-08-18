import { WebSocket, WebSocketServer } from "ws";

type Waiter<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout | undefined;
};

class GenericWebsocketServer {
    #server: WebSocketServer;
    #sockets = new Set<WebSocket>();
    #messages: string[] = [];
    #connectionWaiters: Waiter<void>[] = [];
    #messageWaiters: Waiter<void>[] = [];

    constructor(port: number) {
        this.#server = new WebSocketServer({ port, host: "localhost" });
        this.#server.on("connection", (socket) => this.#handleConnection(socket));
    }

    waitUntilListening(): Promise<void> {
        const { promise, resolve, reject } = Promise.withResolvers<void>();
        this.#server.once("listening", resolve);
        this.#server.once("error", reject);
        return promise;
    }

    awaitConnection(timeoutMs?: number): Promise<void> {
        if (this.#sockets.size > 0) {
            return Promise.resolve();
        }

        const waiter = this.#createWaiter<void>(timeoutMs, "connection");
        this.#connectionWaiters.push(waiter);
        return waiter.promise;
    }

    sendMessage(message: string): void {
        for (const socket of this.#sockets) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(message);
            }
        }
    }

    awaitMessage(timeoutMs?: number): Promise<void> {
        const waiter = this.#createWaiter<void>(timeoutMs, "message");
        this.#messageWaiters.push(waiter);
        return waiter.promise;
    }

    takeMessages(): string[] {
        return this.#messages.splice(0, this.#messages.length);
    }

    async close(): Promise<void> {
        this.#rejectWaiters(this.#connectionWaiters, "Websocket server closed.");
        this.#rejectWaiters(this.#messageWaiters, "Websocket server closed.");

        for (const socket of this.#sockets) {
            socket.close();
        }

        const { promise, resolve, reject } = Promise.withResolvers<void>();
        this.#server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });

        await promise;
    }

    #handleConnection(socket: WebSocket): void {
        this.#sockets.add(socket);
        socket.on("close", () => this.#sockets.delete(socket));
        socket.on("message", (data) => this.#handleMessage(`${data}`));

        const waiters = this.#connectionWaiters.splice(0, this.#connectionWaiters.length);
        for (const waiter of waiters) {
            this.#resolveWaiter(waiter, undefined);
        }
    }

    #handleMessage(message: string): void {
        this.#messages.push(message);

        const waiters = this.#messageWaiters.splice(0, this.#messageWaiters.length);
        for (const waiter of waiters) {
            this.#resolveWaiter(waiter, undefined);
        }
    }

    #createWaiter<T>(timeoutMs: number | undefined, label: string): Waiter<T> {
        const { promise, resolve, reject } = Promise.withResolvers<T>();
        const waiter: Waiter<T> = { promise, resolve, reject, timeout: undefined };
        if (timeoutMs !== undefined) {
            waiter.timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for websocket ${label}.`));
            }, timeoutMs);
        }
        return waiter;
    }

    #resolveWaiter<T>(waiter: Waiter<T>, value: T): void {
        if (waiter.timeout) {
            clearTimeout(waiter.timeout);
        }
        waiter.resolve(value);
    }

    #rejectWaiters<T>(waiters: Waiter<T>[], message: string): void {
        const pendingWaiters = waiters.splice(0, waiters.length);
        for (const waiter of pendingWaiters) {
            if (waiter.timeout) {
                clearTimeout(waiter.timeout);
            }
            waiter.reject(new Error(message));
        }
    }
}

class GenericWebsocketManager {
    #servers = new Map<number, GenericWebsocketServer>();

    async open(port: number): Promise<void> {
        if (this.#servers.has(port)) {
            return;
        }

        const server = new GenericWebsocketServer(port);
        await server.waitUntilListening();
        this.#servers.set(port, server);
    }

    awaitConnection(port: number, timeoutMs?: number): Promise<void> {
        return this.#getServer(port).awaitConnection(timeoutMs);
    }

    sendMessage(port: number, message: string): void {
        this.#getServer(port).sendMessage(message);
    }

    awaitMessage(port: number, timeoutMs?: number): Promise<void> {
        return this.#getServer(port).awaitMessage(timeoutMs);
    }

    takeMessages(port: number): string[] {
        return this.#getServer(port).takeMessages();
    }

    async close(port: number): Promise<void> {
        const server = this.#servers.get(port);
        if (!server) {
            return;
        }

        this.#servers.delete(port);
        await server.close();
    }

    #getServer(port: number): GenericWebsocketServer {
        const server = this.#servers.get(port);
        if (!server) {
            throw new Error(`No websocket server is open on port ${port}.`);
        }
        return server;
    }
}

export const globalWebsocketManager = new GenericWebsocketManager();
