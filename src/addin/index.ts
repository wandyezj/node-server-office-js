console.log("Client");
import config from "./../server/config.json";
import { handleProtocolMessage } from "./handleProtocolMessage";
import { ProtocolMessage } from "./ProtocolMessage";

function startWebsocket() {
    // 1. Establish the connection
    const port = config.socket.port;
    const socket = new WebSocket(`ws://localhost:${port}`);

    // 2. Connection opened
    socket.addEventListener("open", (event) => {
        console.log("Connected to the server!");
        socket.send("Message from client");
    });

    // 3. Listen for messages
    socket.addEventListener("message", async (event) => {
        const { data } = event;
        console.log("Message from server: ", data);
        const result = await handleProtocolMessage(data);
        socket.send(JSON.stringify(result));
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
