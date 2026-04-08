import { expect, test } from "@playwright/test";

test("GET / ping", async ({ request }) => {
    const response = await request.get("/ping");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("pong");
});
