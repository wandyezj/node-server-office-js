import * as path from "node:path";
import {
    MicroCommandOfficeDocumentEmbedAddIn,
    MicroCommandOfficeDocumentEmbedAddInResult,
} from "./MicroCommand";
import { assertFileExtension, FileExtensions } from "../utility/assertFileExtension";
import { embedAddIn } from "../utility/embedAddin";
import { globalLog } from "../../globalLog";

export function runMicroCommandOfficeDocumentEmbedAddIn(
    command: MicroCommandOfficeDocumentEmbedAddIn,
): MicroCommandOfficeDocumentEmbedAddInResult {
    const { filePathIn, filePathOut, settings } = command.parameters;

    // Embed only works for Excel files.
    assertFileExtension(filePathIn, FileExtensions.Xlsx, "filePathIn");
    assertFileExtension(filePathOut, FileExtensions.Xlsx, "filePathOut");

    const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));

    globalLog.log(`Embedding add-in into Excel file: ${filePathIn} -> ${filePathOut}`);

    embedAddIn(filePathIn, manifestPath, filePathOut, { settings });
    return { success: true };
}
