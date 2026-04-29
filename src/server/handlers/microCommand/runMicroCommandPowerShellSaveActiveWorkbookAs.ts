import { execSync } from "node:child_process";
import * as path from "node:path";
import { globalLog } from "../../globalLog";
import {
    MicroCommandPowerShellSaveActiveWorkbookAs,
    MicroCommandPowerShellSaveActiveWorkbookAsResult,
} from "./MicroCommand";

/**
 * Saves the currently open Excel workbook to a new location.
 * @param {string} destinationPath - The path where you want to save the file.
 */
function saveActiveExcelWorkbookAs(destinationPath: string) {
    // Convert to an absolute path for Windows COM
    const absolutePath = path.resolve(destinationPath);
    if (absolutePath.includes("'")) {
        throw "File path cannot contain single quotes.";
    }

    // The PowerShell logic
    const psCommand = `
        $excel = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application');
        $wb = $excel.ActiveWorkbook;
        if ($wb) {
            $excel.DisplayAlerts = $false;
            $wb.SaveAs('${absolutePath}');
            Write-Host 'Successfully saved to: ${absolutePath}';
        } else {
            Write-Error 'No active workbook found.';
        }
    `;

    // Run the command
    const output = execSync(`powershell -Command "${psCommand.replace(/\n/g, " ")}"`);
    console.log(output.toString().trim());
}

export async function runMicroCommandPowerShellSaveActiveWorkbookAs(
    command: MicroCommandPowerShellSaveActiveWorkbookAs,
): Promise<MicroCommandPowerShellSaveActiveWorkbookAsResult> {
    const { filePath } = command.parameters;

    saveActiveExcelWorkbookAs(filePath);
    return { success: true };
}
