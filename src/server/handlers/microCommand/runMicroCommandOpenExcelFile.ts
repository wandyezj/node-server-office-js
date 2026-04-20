import * as fs from "node:fs";
import * as path from "node:path";
import { globalProcesses } from "../../globalProcesses";
import { embedAddIn } from "../utility/embedAddin";
import {
    MicroCommandOpenExcelFile,
    MicroCommandOpenExcelFileResult,
    MicroCommandResultError,
} from "./MicroCommand";

export async function runMicroCommandOpenExcelFile(
    command: MicroCommandOpenExcelFile,
): Promise<MicroCommandOpenExcelFileResult | MicroCommandResultError> {
    const { filePath } = command.parameters;

    const { dir, name, ext } = path.parse(filePath);
    const filePathTemp = path.join(dir, `${name}-temp${ext}`);

    const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));
    embedAddIn(filePath, manifestPath, filePathTemp);

    const excelPathBase = String.raw`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPathX86 = String.raw`C:\Program Files (x86)\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPath = fs.existsSync(excelPathBase)
        ? excelPathBase
        : fs.existsSync(excelPathX86)
        ? excelPathX86
        : undefined;

    if (!excelPath) {
        return { success: false, error: "Excel executable not found" };
    }

    const id = globalProcesses.spawn(excelPath, [filePathTemp], {
        tag: "excel",
        filePathSource: filePath,
        filePathOpen: filePathTemp,
    });

    return { success: true, id };
}
