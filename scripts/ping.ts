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
import { parse } from "jsonc-parser";

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
        ["run-micro-commands"]: {
            type: "boolean",
        },
        ["open-excel"]: {
            type: "boolean",
        },
        ["file-path"]: {
            type: "string",
            default: defaultFilePath,
        },
        ["env-file-path"]: {
            type: "string",
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
    console.log(JSON.stringify(body, null, 4));
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 4));
}

function parseEnvFile(filePathEnv?: string): Record<string, unknown> {
    if (!filePathEnv) {
        return {};
    }
    const data = parse(readFileSync(filePathEnv, "utf-8"));

        const defaultEnv = {
        "root": path.normalize(rootDirectory).replace(/\\/g, "/")
    }

    return substituteVariables(data, defaultEnv) as Record<
        string,
        unknown
    >;
}

async function commandRunMicroCommands(filePath: string, filePathEnv: string | undefined) {
    const url = `${baseUrl}/run-micro-commands`;
    if (!filePath) {
        console.error("Please provide a file path using --file-path");
        return;
    }

    console.log(`Run micro commands from file: ${filePath}`);
    const data = readFileSync(filePath, "utf-8");
    const environment = parseEnvFile(filePathEnv);

    const commands = substituteVariables(parse(data), environment);

    await postCommand(url, commands as Record<string, any>);
}

function substituteVariables(value: unknown, environment: Record<string, unknown>): unknown {

    // Recurse Array
    if (Array.isArray(value)) {
        return value.map((item) => substituteVariables(item, environment));
    }

    // Recurse Map
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [
                key,
                substituteVariables(child, environment),
            ]),
        );
    }

    if (typeof value !== "string") {
        return value;
    }


    function replaceVariable(variableName: string): unknown {
        if (!(variableName in environment)) {
            throw new Error(`Missing environment variable: ${variableName}`);
        }
        return environment[variableName];
    };


    // Supports substitution syntax of: `${var}` and `%var%`

    // Allow substitution of entire value - to allow type replacement
    const exactMatch = value.match(/^(?:\$\{([^}]+)\}|%([^%]+)%)$/);
    if (exactMatch) {
        return replaceVariable(exactMatch[1] ?? exactMatch[2]);
    }

    // Allow substitution within values
    return value.replace(/\$\{([^}]+)\}|%([^%]+)%/g, (match, dollarName, percentName) => {
        const variableName = dollarName ?? percentName;
        const replacement = replaceVariable(variableName);
        return String(replacement);
    });
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

    if (values["run-micro-commands"]) {
        const filePath = values["file-path"];
        const filePathEnv = values["env-file-path"];
        await commandRunMicroCommands(filePath, filePathEnv);
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
