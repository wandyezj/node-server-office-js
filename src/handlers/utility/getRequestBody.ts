import * as http from "http";

export async function getRequestBody(request: http.IncomingMessage): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let data = "";
        request.on("data", (chunk) => {
            data += chunk.toString();
        });
        request.on("end", () => resolve(data));
        request.on("error", reject);
    });
}
