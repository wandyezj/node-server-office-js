import * as fs from "node:fs";

export function getExcelPath(): string | undefined {
    const excelPathBase = String.raw`C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPathX86 = String.raw`C:\Program Files (x86)\Microsoft Office\root\Office16\EXCEL.EXE`;
    const excelPath = fs.existsSync(excelPathBase)
        ? excelPathBase
        : fs.existsSync(excelPathX86)
        ? excelPathX86
        : undefined;
    return excelPath;
}
