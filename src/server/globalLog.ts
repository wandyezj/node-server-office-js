import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function getIndent(indent: number | undefined) {
    if (indent === undefined || indent === 0) {
        return "";
    }

    return " ".repeat(indent * 4);
}

function applyIndent(message: string, indent: number) {
    const indentStr = getIndent(indent);
    return message
        .split("\n")
        .map((line) => (line.trim() === "" ? "" : indentStr + line))
        .join("\n");
}

class CommonLogger {
    #indent = 0;
    #filePath: string | undefined;

    indent() {
        this.#indent++;
    }

    outdent() {
        if (this.#indent > 0) {
            this.#indent--;
        }
    }

    #getIndent(options?: { indent?: number; indentAdjust?: number }): number {
        return Math.max(0, (options?.indent ?? this.#indent) + (options?.indentAdjust ?? 0));
    }

    startFileLog(filePath: string) {
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, "");
        this.#filePath = filePath;
    }

    endFileLog() {
        this.#filePath = undefined;
    }

    #write(message: string, consoleLog: (message: string) => void) {
        consoleLog(message);

        if (this.#filePath === undefined) {
            return;
        }

        try {
            appendFileSync(this.#filePath, `${message}\n`);
        } catch (error) {
            const filePath = this.#filePath;
            this.#filePath = undefined;
            console.error(`Failed to write log file ${filePath}: ${error}`);
        }
    }

    log(message: string, options?: { indent?: number; indentAdjust?: number }) {
        const indent = this.#getIndent(options);
        this.#write(applyIndent(message, indent), console.log);
    }

    error(message: string, options?: { indent?: number; indentAdjust?: number }) {
        const indent = this.#getIndent(options);
        this.#write(applyIndent(message, indent), console.error);
    }
}

export const globalLog = new CommonLogger();
