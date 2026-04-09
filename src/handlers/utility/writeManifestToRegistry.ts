import { execSync } from "child_process";

export function writeManifestToRegistry(guid: string, manifestPath: string): void {
    const keyPath = `HKCU\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer`;
    execSync(`reg add "${keyPath}" /v "${guid}" /t REG_SZ /d "${manifestPath}" /f`, {
        stdio: "inherit",
    });
}
