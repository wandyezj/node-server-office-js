import * as net from "node:net";

export async function getAvailablePort(): Promise<number> {
    const server = net.createServer();
    const listening = Promise.withResolvers<void>();
    server.listen(0, listening.resolve);
    await listening.promise;
    const address = server.address();
    const closed = Promise.withResolvers<void>();
    server.close((error) => {
        if (error) {
            closed.reject(error);
            return;
        }
        closed.resolve();
    });
    await closed.promise;

    if (!address || typeof address === "string") {
        throw new Error("Failed to find an available port.");
    }

    return address.port;
}
