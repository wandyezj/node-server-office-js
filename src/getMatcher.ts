import * as http from "http";
import { FunctionRequestMatcher } from "./handleRequest";

export function getMatcher(match: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
    url: string;
    origin?: string;
}): FunctionRequestMatcher {
    function matches(matchValue: string | undefined, requestValue: string | undefined): boolean {
        if (!matchValue) {
            return true; // If matcher is undefined, it matches anything
        }

        if (matchValue === requestValue) {
            return true; // Exact match
        }

        return false; // No match
    }

    function matcher(request: http.IncomingMessage): boolean {
        // Match then request
        return (
            matches(match.method, request.method) &&
            matches(match.url, request.url) &&
            matches(match.origin, request.headers.origin)
        );
    }

    return matcher;
}
