import { expect, test } from "@playwright/test";

test("GET / returns Hello World", async ({ request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("Hello World");
});
