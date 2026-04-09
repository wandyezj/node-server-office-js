import { execSync } from "child_process";

export function writeManifestToRegistry(guid: string, manifestPath: string): void {
    const keyPath = `HKCU\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer`;
    execSync(`reg add "${keyPath}" /v "${guid}" /t REG_SZ /d "${manifestPath}" /f`, {
        stdio: "inherit",
    });

    // Excel requires debug flags in a subkey for the add-in GUID,
    // otherwise it treats the sideloaded add-in as a stale dev session.
    //const subKeyPath = `${keyPath}\\${guid}`;
    // const debugFlags = [
    //     { name: "UseDirectDebugger", value: 1 },
    //     { name: "UseWebDebugger", value: 0 },
    //     { name: "UseLiveReload", value: 0 },
    // ];
    // for (const flag of debugFlags) {
    //     execSync(
    //         `reg add "${subKeyPath}" /v ${flag.name} /t REG_DWORD /d ${flag.value} /f`,
    //         { stdio: "inherit" },
    //     );
    // }
}
