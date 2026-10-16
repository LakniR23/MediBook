import { test, expect } from "@playwright/test";

test.describe("Authentication & Registration Flow", () => {
  test("redirects /signup to /register automatically", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForURL("**/register");
    expect(page.url()).toContain("/register");
    await expect(page.locator("text=Register Staff Profile")).toBeVisible();
  });

  test("loads the registration page with Sri Lankan clinical requirements", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator("text=MediBook").first()).toBeVisible();
    await expect(page.locator("text=Sri Lanka Health Service Intake")).toBeVisible();
    await expect(page.locator("text=10-Digit Sri Lankan Phone")).toBeVisible();
    await expect(page.locator("text=Sri Lankan Address")).toBeVisible();
  });

  test("validates 10-digit Sri Lankan phone number on registration", async ({ page }) => {
    await page.goto("/register");

    // Enter short phone
    await page.locator("input[placeholder='0771234567']").fill("077123");
    await page.locator("input[placeholder='e.g. Dr. Priyantha Silva']").fill("Dr. Sunil Fernando");
    await page.locator("input[placeholder='e.g. priyantha.silva@gmail.com']").fill("sunil.fernando@gmail.com");
    await page.locator("input[placeholder*='Galle Road']").fill("No 12, Kandy Road, Peradeniya");
    await page.locator("input[placeholder='At least 6 characters']").fill("pass123");
    await page.locator("input[placeholder='Repeat password']").fill("pass123");

    await page.locator("button[type='submit']").click();

    // Error message should appear
    await expect(
      page.locator("text=Phone number must be exactly 10 digits (e.g. 0771234567).")
    ).toBeVisible();
  });

  test("allows switching to Login page", async ({ page }) => {
    await page.goto("/register");
    await page.locator("text=Sign In Instead →").click();
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("stays on /login page when refreshed without an active session (no auto-login)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h2:has-text('Sign in to your account')")).toBeVisible();

    // Reload the login page
    await page.reload();

    // Must still be on login page, not auto-logged in or redirected to /
    await expect(page.locator("h2:has-text('Sign in to your account')")).toBeVisible();
    expect(page.url()).toContain("/login");
  });
});

