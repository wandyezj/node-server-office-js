import { parseArgs } from "node:util";
import path from "node:path";

import config from "../src/config.json";

const port = config.port;

const defaultFilePath = path
    .normalize(path.join(__dirname, "..", "test", "test.xlsx"))
    .replace(/\\/g, "/");

// npm run ping -- --ping
// npm run ping -- --open-excel --file-path "C:\file.xlsx"
// npm run ping -- --close-excel --id 12345

const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
        ping: {
            type: "boolean",
            default: false,
        },
        ["open-excel"]: {
            type: "boolean",
        },
        ["file-path"]: {
            type: "string",
            default: defaultFilePath,
        },
        ["close-excel"]: {
            type: "boolean",
        },
        ["id"]: {
            type: "string",
        },
    },
});

const baseUrl = `http://localhost:${port}`;

async function commandPing() {
    console.log("Pinging server...");
    const url = `${baseUrl}/ping`;
    const response = await fetch(url);
    const data = await response.text();
    console.log(data);
}

async function postCommand(url: string, body: Record<string, any>) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log(data);
}

async function commandOpenExcel(filePath: string) {
    if (!filePath) {
        console.error("Please provide a file path using --file-path");
        return;
    }
    console.log(`Open Excel file: ${filePath}`);

    const url = `${baseUrl}/open-excel-file`;
    await postCommand(url, { filePath });
}

async function commandCloseExcel(id: number) {
    console.log(`Close Excel file with ID: ${id}`);

    const url = `${baseUrl}/close-excel-file`;
    await postCommand(url, { id });
}

async function main() {
    if (values.ping) {
        await commandPing();
    }

    if (values["open-excel"]) {
        const filePath = values["file-path"];
        await commandOpenExcel(filePath);
    }

    if (values["close-excel"]) {
        const id = values["id"];
        console.log("Closing Excel file with ID:", id);
        if (id === undefined) {
            console.error("Please provide the process ID to close using --id");
            return;
        }
        const numericId = Number.parseInt(id);
        if (isNaN(numericId)) {
            console.error("Invalid ID provided. Please provide a valid number for --id");
            return;
        }

        await commandCloseExcel(numericId);
    }
}

main();
