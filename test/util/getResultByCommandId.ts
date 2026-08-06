import {
    MicroCommandBodyResult,
    MicroCommandResult,
} from "../../src/server/handlers/microCommand/MicroCommand";

export function getResultByCommandId(
    message: MicroCommandBodyResult,
    id: string,
): MicroCommandResult {
    const result = message.results.find((r) => r.id === id);
    if (!result) {
        throw new Error(`No result found for command ID: ${id}`);
    }
    return result;
}
