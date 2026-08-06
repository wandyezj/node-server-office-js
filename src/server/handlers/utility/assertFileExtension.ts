export enum FileExtensions {
    Xlsx = ".xlsx",
}

export function assertFileExtension(
    filePath: string,
    fileExtension: FileExtensions,
    description: string,
) {
    // case insensitive check, but might not be the case.
    if (!filePath.toLowerCase().endsWith(fileExtension)) {
        throw new Error(`${description} must end in ${fileExtension}: ${filePath}`);
    }
}
