import packageJson from "../../../../package.json";
import {
    MicroCommandMetadataServerVersion,
    MicroCommandMetadataServerVersionResult,
} from "./MicroCommand";

export function runMicroCommandMetadataServerVersion(
    _command: MicroCommandMetadataServerVersion,
): MicroCommandMetadataServerVersionResult {
    return { success: true, values: { version: packageJson.version } };
}