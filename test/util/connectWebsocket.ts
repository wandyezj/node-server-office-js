import { WebSocket } from "ws";

export function connectWebsocket(
    port: number,
    timeoutMs: number = 5000,
): Promise<{
    socket: WebSocket;
    receivedMessage: Promise<string>;
}> {
    const deadline = Date.now() + timeoutMs;
    const connection = Promise.withResolvers<{
        socket: WebSocket;
        receivedMessage: Promise<string>;
    }>();

    function attemptConnection(): void {
        const socket = new WebSocket(`ws://127.0.0.1:${port}`);
        const receivedMessage = Promise.withResolvers<string>();
        const retryTimeoutMs = 25;

        socket.once("message", (data) => receivedMessage.resolve(`${data}`));
        socket.once("open", () => {
            socket.off("error", handleConnectionError);
            socket.once("error", receivedMessage.reject);
            connection.resolve({ socket, receivedMessage: receivedMessage.promise });
        });

        function handleConnectionError(error: Error): void {
            socket.close();
            if (Date.now() >= deadline) {
                connection.reject(error);
                return;
            }
            setTimeout(attemptConnection, retryTimeoutMs);
        }

        socket.once("error", handleConnectionError);
    }

    attemptConnection();
    return connection.promise;
}
