export function parseJson<T>(data: string): T | undefined {
    try {
        return JSON.parse(data) as T;
    } catch (error) {
        //console.error("Failed to parse JSON:", error);
        return undefined;
    }
}
