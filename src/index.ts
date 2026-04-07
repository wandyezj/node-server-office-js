import { createServer, IncomingMessage, ServerResponse } from "node:http";

const port = Number(process.env.PORT) || 3000;

console.log("Server starting...");


const server = createServer((_req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
	res.end("Hello World\n");
});

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

console.log(`https://${process.env.HOST || 'localhost'}:${port}`);
