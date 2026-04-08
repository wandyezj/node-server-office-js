import config from "../src/config.json";

const port = config.port;

console.log("Starting ping script...");

async function main() {
    const response = await fetch(`http://localhost:${port}/ping`);
    const data = await response.text();
    console.log(data);
}

main();