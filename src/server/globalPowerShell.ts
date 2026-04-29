import * as path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { embedAddIn } from "./handlers/utility/embedAddin";
import { getAndSaveExcelContents } from "./handlers/utility/getAndSaveExcelContents";
import { globalWebsocket } from "./globalWebsocket";
import { globalLog } from "./globalLog";

function powershellSendCommand(ps: ChildProcess, cmd: string): void {
    if (ps.stdin?.writable) {
        ps.stdin.write(`${cmd}\n`);
    }
}

function powershellOpen() {
    const ps = spawn("powershell", ["-NoExit", "-Command", "-"], {
        stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle output for debugging
    ps.stdout?.on("data", (data: Buffer) =>
        globalLog.log(`[PS] ${data.toString().trim()}`, { indent: 2 }),
    );
    ps.stderr?.on("data", (data: Buffer) =>
        globalLog.log(`[PS] [ERROR] ${data.toString().trim()}`, { indent: 2 }),
    );

    // --- The Cleanup Listeners ---

    // 1. Handle Ctrl+C (SIGINT)
    process.on("SIGINT", () => {
        console.log("\n[Node] Interrupted. Cleaning up Excel...");
        powershellForceQuit(ps);
        process.exit();
    });

    // 2. Handle unexpected crashes
    process.on("uncaughtException", (err) => {
        console.error(`[Node] Crash detected: ${err.message}`);
        powershellForceQuit(ps);
        process.exit(1);
    });

    // 3. Final safety net on exit
    process.on("exit", () => {
        powershellForceQuit(ps);
    });
    return ps;
}

function powershellOpenExcel(ps: ChildProcess, filePath: string) {
    const absolutePath = path.resolve(filePath);
    //
    //$excel.DisplayAlerts = $false
    powershellSendCommand(
        ps,
        `
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $true
$wb = $excel.Workbooks.Open('${absolutePath}')
`,
    );
}

function powershellCloseExcel(ps: ChildProcess) {
    powershellSendCommand(
        ps,
        `
if ($wb) { $wb.Close($true) }
if ($excel) { $excel.Quit() }
exit
`,
    );
}

function powershellForceQuit(ps: ChildProcess) {
    try {
        powershellSendCommand(
            ps,
            `
Stop-Process -Name "Excel" -ErrorAction SilentlyContinue
exit
`,
        );
        ps.kill();
    } catch {
        // ignore
    }
}

class PowerShellManager {
    // Only allow a single excel instance at a time.
    #ps: ChildProcess | undefined = undefined;

    constructor() {}

    async openExcelFile(filePath: string): Promise<undefined> {
        globalLog.log("Open Excel File", { indent: 1 });
        if (this.#ps !== undefined) {
            throw new Error("Excel already open");
        }

        const { dir, name, ext } = path.parse(filePath);
        const filePathTemp = path.join(dir, `${name}-temp${ext}`);

        const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));
        embedAddIn(filePath, manifestPath, filePathTemp);

        const connectionPromise = globalWebsocket.waitForConnection();

        this.#ps = powershellOpen();
        //powershellSendCommand(this.#ps, `$host.ui.RawUI.WindowTitle = "Excel_Automation_Worker"`);

        globalLog.log("powershellOpenExcel - start", { indent: 1 });
        powershellOpenExcel(this.#ps, filePathTemp);
        globalLog.log("powershellOpenExcel - end", { indent: 1 });

        await connectionPromise;
    }

    async saveExcelFile(filePath: string): Promise<void> {
        globalLog.log("Save Excel File", { indent: 1 });
        // TODO: replace with COM save
        await getAndSaveExcelContents(filePath);
    }

    async closeExcelFile(): Promise<void> {
        globalLog.log("Close Excel File", { indent: 1 });
        if (this.#ps === undefined) {
            return;
        }
        powershellCloseExcel(this.#ps);
        this.#ps = undefined;
    }
}

export const globalPowerShell = new PowerShellManager();
