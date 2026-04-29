import { execSync } from "node:child_process";
import * as path from "node:path";
import {
    MicroCommandPowerShellSaveActiveWorkbookAs,
    MicroCommandPowerShellSaveActiveWorkbookAsResult,
} from "./MicroCommand";
import { extractAddinFromZipFile } from "../utility/embedAddin";
import { globalLog } from "../../globalLog";

/**
 * Saves the currently open Excel workbook to a new location.
 * @param {string} destinationPath - The path where you want to save the file.
 */
function saveActiveExcelWorkbookAs(destinationPath: string) {
    // Convert to an absolute path for Windows COM
    const filePath = path.resolve(destinationPath);
    if (filePath.includes("'")) {
        throw "File path cannot contain single quotes.";
    }

    // The PowerShell logic
    const psCommand = `
        $excel = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application');
        $wb = $excel.ActiveWorkbook;
        if ($wb) {
            $excel.DisplayAlerts = $false;
            $wb.SaveCopyAs('${filePath}');
            Write-Host 'Successfully saved to: ${filePath}';
        } else {
            Write-Error 'No active workbook found.';
        }
        exit 0
    `;

    // Run the command
    const output = execSync(`powershell -Command "${psCommand.replace(/\n/g, " ")}"`);
    globalLog.log(output.toString().trim());

    // Remove the embedded Add-In from the saved file
    extractAddinFromZipFile(filePath, filePath);
    globalLog.log(`Removed embedded Add-In from: ${filePath}`);
}

export async function runMicroCommandPowerShellSaveActiveWorkbookAs(
    command: MicroCommandPowerShellSaveActiveWorkbookAs,
): Promise<MicroCommandPowerShellSaveActiveWorkbookAsResult> {
    const { filePath } = command.parameters;

    saveActiveExcelWorkbookAs(filePath);
    return { success: true };
}
