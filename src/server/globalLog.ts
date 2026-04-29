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
        .map((line) => indentStr + line)
        .join("\n");
}

class CommonLogger {
    #indent = 0;

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

    log(message: string, options?: { indent?: number; indentAdjust?: number }) {
        const indent = this.#getIndent(options);
        console.log(applyIndent(message, indent));
    }

    error(message: string, options?: { indent?: number; indentAdjust?: number }) {
        const indent = this.#getIndent(options);
        console.error(applyIndent(message, indent));
    }
}

export const globalLog = new CommonLogger();
