import * as fs from "node:fs/promises";
import { MicroCommandReadFileContents, MicroCommandReadFileContentsResult } from "./MicroCommand";

export async function runMicroCommandReadFileContents(
    command: MicroCommandReadFileContents,
): Promise<MicroCommandReadFileContentsResult> {
    const contents = await fs.readFile(command.parameters.filePath, "utf8");
    return { success: true, values: { contents } };
}
