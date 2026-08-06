console.log("Client");
import config from "./../server/config.json";
import { handleProtocolMessage } from "./handleProtocolMessage";
import { ProtocolMessageReady } from "./ProtocolMessage";

function startWebsocket(port: number) {
    // 1. Establish the connection

    const socket = new WebSocket(`ws://localhost:${port}`);

    // 2. Connection opened
    socket.addEventListener("open", (event) => {
        console.log(`Connected to the server! on port ${port}`);
        socket.send(ProtocolMessageReady);
    });

    // 3. Listen for messages
    socket.addEventListener("message", async (event) => {
        const { data } = event;
        console.log(`Receive: ${data}`);

        const result = await handleProtocolMessage(data);

        const dataBack = JSON.stringify(result);
        console.log(`Send: ${dataBack}`);

        socket.send(dataBack);
    });

    // 4. Handle errors
    socket.addEventListener("error", (error) => {
        console.error("WebSocket Error: ", error);
    });
}

function getSettingPort(): number | undefined {
    try {
        const value = Office.context.document.settings.get("settings");
        console.log(value);
        console.log(typeof value);
        return value?.port;
    } catch (error) {
        console.error("Error getting setting port: ", error);
        return undefined;
    }
}

Office.onReady((info) => {
    console.log("Office onReady");
    const port = getSettingPort() ?? config.socket.port;
    console.log(`Using port: ${port}`);
    startWebsocket(port);
});
