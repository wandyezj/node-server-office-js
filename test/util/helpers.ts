import { readFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import * as path from "path";

const rootDirectory = path.join(__dirname, "..", "..");

export const defaultFilePath = path
    .normalize(path.join(rootDirectory, "test", "test.xlsx"))
    .replace(/\\/g, "/");
const defaultCodeFileDirectory = path
    .normalize(path.join(rootDirectory, "test", "data"))
    .replace(/\\/g, "/");

const defaultPathOutDirectory = path
    .normalize(path.join(rootDirectory, "test", "out"))
    .replace(/\\/g, "/");

export const defaultFileOutPath = path
    .normalize(path.join(defaultPathOutDirectory, "test-out.xlsx"))
    .replace(/\\/g, "/");

export const defaultFileTempPath = path
    .normalize(path.join(defaultPathOutDirectory, "test-temp.xlsx"))
    .replace(/\\/g, "/");
export function getCodeFile(fileName: string) {
    return path.normalize(path.join(defaultCodeFileDirectory, fileName)).replace(/\\/g, "/");
}
export function getCodeFromFile(filePath: string) {
    return readFileSync(getCodeFile(filePath), "utf-8");
}
export const defaultCodeFilePath = getCodeFile("hello-world-excel.js");
const defaultLogFileDirectory = defaultPathOutDirectory;
export function getDefaultLogFilePath(fileName: string = "micro-command.log") {
    const logFilePath = path
        .normalize(path.join(defaultLogFileDirectory, fileName))
        .replace(/\\/g, "/");
    if (existsSync(logFilePath)) {
        unlinkSync(logFilePath);
    }
    return logFilePath;
}
export function cleanOutDirectory() {
    if (existsSync(defaultFileOutPath)) {
        unlinkSync(defaultFileOutPath);
    }
    mkdirSync(defaultPathOutDirectory, { recursive: true });
}
