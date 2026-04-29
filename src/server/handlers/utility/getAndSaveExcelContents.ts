import { writeFileSync } from "node:fs";
import { globalWebsocket } from "../../globalWebsocket";
import { codeGetFileContentsBase64 } from "./codeGetFileBase64";
import { globalLog } from "../../globalLog";
import { extractAddinFromZipBuffer } from "./embedAddin";

function saveBase64ToFile(base64String: string, filePath: string) {
    // 1. Remove the data URL prefix if it exists (e.g., "data:application/vnd...;base64,")
    const base64Data = base64String.replace(/^data:.*?;base64,/, "");

    // 2. Convert Base64 string to a Buffer
    const buffer = Buffer.from(base64Data, "base64");

    // 3. Remove the embedded Add-In from the buffer
    const bufferClean = extractAddinFromZipBuffer(buffer);

    // 4. Write the buffer to the disk
    writeFileSync(filePath, bufferClean);
    globalLog.log(`File saved successfully to: ${filePath}`);
}

/**
 * Get the contents of the Excel file from the Excel add-in and save it to the specified file path
 * @param filePath The path where the Excel file should be saved
 */
export async function getAndSaveExcelContents(filePath: string) {
    const result = await globalWebsocket.sendEval(codeGetFileContentsBase64);
    const { result: fileData, error } = result.data;
    if (error) {
        console.error(`Failed to get Excel file content: ${error}`);
        throw new Error(`Failed to get Excel file content: ${error}`);
    }

    if (fileData) {
        saveBase64ToFile(fileData, filePath);
    }
}
