// Read all entries under the Office WEF Developer registry key
// and print each GUID and its manifest path.
// Usage: npx ts-node scripts/readManifestRegistry.ts

import { execSync } from "node:child_process";

const keyPath = `HKCU\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer`;

try {
    const output = execSync(`reg query "${keyPath}"`, { encoding: "utf8" });

    const lines = output.split(/\r?\n/);
    const entries: { guid: string; manifestPath: string }[] = [];

    for (const line of lines) {
        // Each value line looks like:
        //     <GUID>    REG_SZ    <path>
        const match = line.match(/^\s+(\S+)\s+REG_SZ\s+(.+)$/);
        if (match) {
            entries.push({ guid: match[1], manifestPath: match[2].trim() });
        }
    }

    if (entries.length === 0) {
        console.log("No manifest entries found.");
    } else {
        for (const { guid, manifestPath } of entries) {
            console.log(`Key Path: ${keyPath}\\${guid}`);
            console.log(`GUID:          ${guid}`);
            console.log(`Manifest path: ${manifestPath}`);
            console.log();
        }
    }
} catch {
    console.error(`Registry key not found or inaccessible: ${keyPath}`);
    process.exit(1);
}
