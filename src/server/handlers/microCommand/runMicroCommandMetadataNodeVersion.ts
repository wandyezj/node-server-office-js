import {
    MicroCommandMetadataNodeVersion,
    MicroCommandMetadataNodeVersionResult,
} from "./MicroCommand";

export function runMicroCommandMetadataNodeVersion(
    _command: MicroCommandMetadataNodeVersion,
): MicroCommandMetadataNodeVersionResult {
    return { success: true, values: { version: process.versions.node } };
}
