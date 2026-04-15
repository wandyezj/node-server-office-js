function getIndent(indent: number | undefined) {
    if (indent === undefined || indent === 0) {
        return "";
    }

    return " ".repeat(indent * 4);
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

    log(message: string, options?: { indent?: number }) {
        console.log(getIndent(options?.indent ?? this.#indent) + message);
    }
}

export const globalLog = new CommonLogger();
