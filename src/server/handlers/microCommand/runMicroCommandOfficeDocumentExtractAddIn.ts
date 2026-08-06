import {
    MicroCommandOfficeDocumentExtractAddIn,
    MicroCommandOfficeDocumentExtractAddInResult,
} from "./MicroCommand";
import { assertFileExtension, FileExtensions } from "../utility/assertFileExtension";
import { extractAddinFromZipFile } from "../utility/embedAddin";

export function runMicroCommandOfficeDocumentExtractAddIn(
    command: MicroCommandOfficeDocumentExtractAddIn,
): MicroCommandOfficeDocumentExtractAddInResult {
    const { filePathIn, filePathOut } = command.parameters;

    // Extract only works for excel files
    assertFileExtension(filePathIn, FileExtensions.Xlsx, "filePathIn");
    assertFileExtension(filePathOut, FileExtensions.Xlsx, "filePathOut");

    extractAddinFromZipFile(filePathIn, filePathOut);

    return { success: true };
}
