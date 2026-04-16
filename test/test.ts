import { expect, test } from "@playwright/test";
import { readFile, readFileSync } from "node:fs";
import * as path from "node:path";

test("GET / ping", async ({ request }) => {
    const response = await request.get("/ping");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("pong");
});

const rootDirectory = path.join(__dirname, "..");

const defaultFilePath = path
    .normalize(path.join(rootDirectory, "test", "test.xlsx"))
    .replace(/\\/g, "/");

const defaultFileOutPath = path
    .normalize(path.join(rootDirectory, "test", "test-out.xlsx"))
    .replace(/\\/g, "/");

const defaultCodeFilePath = path
    .normalize(path.join(rootDirectory, "test", "data", "hello-world-excel.js"))
    .replace(/\\/g, "/");

test("Open Excel File", async ({ request }) => {
    const response = await request.post("/open-excel-file", {
        data: {
            filePath: defaultFilePath,
        },
    });
    expect(response.ok()).toBeTruthy();
});

test("Addin - Ping", async ({ request }) => {
    const responsePing = await request.post("/addin-ping");
    expect(responsePing.ok()).toBeTruthy();
    const body = await responsePing.text();
    const message = JSON.parse(body);
    expect(message.message).toContain("Pong");
});

test("Addin - Eval", async ({ request }) => {
    const code = readFileSync(defaultCodeFilePath, "utf-8");
    const responseEval = await request.post("/addin-eval", {
        data: {
            code,
        },
    });
    expect(responseEval.ok()).toBeTruthy();
    const body = await responseEval.text();
    expect(body).toContain("result");
});

test("Save Excel File", async ({ request }) => {
    const response = await request.post("/save-excel-file", {
        data: {
            filePath: defaultFileOutPath,
        },
    });
    expect(response.ok()).toBeTruthy();
});

test("Close Excel File", async ({ request }) => {
    const response = await request.post("/close-excel-file", {
        data: {
            filePath: defaultFileOutPath,
        },
    });
    expect(response.ok()).toBeTruthy();
});
