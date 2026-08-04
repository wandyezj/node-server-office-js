import * as fs from "node:fs";
import { OfficeAppName } from "../microCommand/MicroCommand";

const officeAppNameToExecutableName: Map<OfficeAppName, string> = new Map([
    [OfficeAppName.Excel, "EXCEL.EXE"],
    [OfficeAppName.Word, "WINWORD.EXE"], // cspell:ignore WINWORD
    [OfficeAppName.PowerPoint, "POWERPNT.EXE"], // cspell:ignore POWERPNT
]);

export function getOfficeAppPath(app: OfficeAppName): string | undefined {
    const executable = officeAppNameToExecutableName.get(app);

    const officeBase = String.raw`C:\Program Files\Microsoft Office\root\Office16`;
    const officeX86 = String.raw`C:\Program Files (x86)\Microsoft Office\root\Office16`;

    const officePathBase = `${officeBase}\\${executable}`;
    const officePathX86 = `${officeX86}\\${executable}`;

    if (fs.existsSync(officePathBase)) {
        return officePathBase;
    }

    if (fs.existsSync(officePathX86)) {
        return officePathX86;
    }

    return undefined;
}
