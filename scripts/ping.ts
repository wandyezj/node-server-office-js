// Test script for pinging the server and interacting with Excel files
//
// Example usage:
// npm run ping -- --ping
// npm run ping -- --open-excel --file-path "C:\file.xlsx"
// npm run ping -- --close-excel --id 12345
// npm run ping -- --addin-ping
// npm run ping -- --addin-eval --code-file "C:\file.js"

import { parseArgs } from "node:util";
import path from "node:path";

import config from "../src/server/config.json";

import { readFileSync } from "node:fs";

const port = config.http.port;

const rootDirectory = path.join(__dirname, "..");

const defaultFilePath = path
    .normalize(path.join(rootDirectory, "test", "test.xlsx"))
    .replace(/\\/g, "/");

const defaultCodeFilePath = path
    .normalize(path.join(rootDirectory, "test", "data", "hello-world-excel.js"))
    .replace(/\\/g, "/");

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
        ["addin-ping"]: {
            type: "boolean",
        },
        ["addin-eval"]: {
            type: "boolean",
        },
        ["code-file"]: {
            type: "string",
            default: defaultCodeFilePath,
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

async function commandCloseExcelById(id: number) {
    console.log(`Close Excel file with ID: ${id}`);

    const url = `${baseUrl}/close-excel-file`;
    await postCommand(url, { id });
}

async function commandCloseExcelByFilePath(filePath: string) {
    console.log(`Close Excel file with file path: ${filePath}`);

    const url = `${baseUrl}/close-excel-file`;
    await postCommand(url, { filePath });
}

async function commandAddinPing() {
    console.log("Pinging Excel file...");
    const url = `${baseUrl}/addin-ping`;
    await postCommand(url, {});
}

async function commandAddinEval(codeFile: string) {
    if (!codeFile) {
        console.error("Please provide code to evaluate using --code-file");
        return;
    }
    console.log(`Eval code in Excel add-in from file: ${codeFile}`);
    const code = readFileSync(codeFile, "utf-8");

    const url = `${baseUrl}/addin-eval`;
    await postCommand(url, { code });
}

async function main() {
    // --ping
    if (values.ping) {
        await commandPing();
    }

    // --open-excel --file-path "C:\file.xlsx"
    if (values["open-excel"]) {
        const filePath = values["file-path"];
        await commandOpenExcel(filePath);
    }

    // --close-excel --id 12345
    if (values["close-excel"]) {
        const id = values["id"];
        const filePath = values["file-path"];

        if (id) {
            console.log(`Closing Excel file with ID: ${id}`);
            const numericId = Number.parseInt(id);
            if (isNaN(numericId)) {
                console.error("Invalid ID provided. Please provide a valid number for --id");
                return;
            }

            await commandCloseExcelById(numericId);
        } else if (filePath) {
            console.log(`Closing Excel file with file path: ${filePath}`);
            await commandCloseExcelByFilePath(filePath);
        } else {
            console.error(
                "Please provide the process ID to close using --id or the file path using --file-path",
            );
            return;
        }
    }

    // --addin-ping
    if (values["addin-ping"]) {
        await commandAddinPing();
    }

    // --addin-eval --code-file "C:\file.js"
    if (values["addin-eval"]) {
        const codeFile = values["code-file"];
        if (codeFile === undefined) {
            console.error("Please provide the code file to evaluate using --code-file");
            return;
        }
        await commandAddinEval(codeFile);
    }
}

main();
