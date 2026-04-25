console.log("Client");
import config from "./../server/config.json";
import { handleProtocolMessage } from "./handleProtocolMessage";
import { ProtocolMessageReady } from "./ProtocolMessage";

function startWebsocket() {
    // 1. Establish the connection
    const port = config.socket.port;
    const socket = new WebSocket(`ws://localhost:${port}`);

    // 2. Connection opened
    socket.addEventListener("open", (event) => {
        console.log("Connected to the server!");
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

Office.onReady((info) => {
    console.log("Office onReady");
    startWebsocket();
});
