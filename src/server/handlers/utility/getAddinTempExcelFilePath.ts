import * as path from "path";
import { embedAddIn } from "./embedAddin";

/**
 * Uses the contents of the specified Excel file and creates a temp file with the embedded add-in.
 * @param filePath The path to the original Excel file.
 * @returns The path to the temporary Excel file with the embedded add-in.
 */
export function getAddinTempExcelFilePath(filePath: string) {
    const { dir, name, ext } = path.parse(filePath);
    const filePathTemp = path.join(dir, `${name}-temp${ext}`);

    const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));
    embedAddIn(filePath, manifestPath, filePathTemp);
    return filePathTemp;
}
