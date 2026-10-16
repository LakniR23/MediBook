import { test, expect } from "@playwright/test";
import { loginAsDoctor } from "./auth.helper";

test.describe("MediBook Appointment Management E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
  });
  test("loads the dashboard with live auto-shift badge and stats", async ({ page }) => {
    await page.goto("/");

    // Verify Brand title & Header
    await expect(page.locator("text=MediBook").first()).toBeVisible();
    await expect(page.locator("h1:has-text('Clinic Overview')")).toBeVisible();
    await expect(page.locator("text=Total Encounters")).toBeVisible();
    await expect(page.locator("span:has-text('Scheduled')").first()).toBeVisible();
  });

  test("loads appointments page with filter controls and table", async ({ page }) => {
    await page.goto("/appointments");

    await expect(page.locator("h1:has-text('Appointments Management')")).toBeVisible();
    await expect(page.locator("input[placeholder*='Search']")).toBeVisible();
    await expect(page.locator("button:has-text('New Appointment')")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("parses natural language search and filters list", async ({ page }) => {
    await page.goto("/appointments");

    // Fill natural language query into search input and press Enter
    const searchInput = page.locator("input[placeholder*='Search']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("cancelled appointments with Dr. Nimal Perera");
    await searchInput.press("Enter");

    // AI banner should show interpretation
    await expect(page.locator("text=Parsed").first()).toBeVisible({ timeout: 10000 });
  });

  test("creates a new appointment successfully with Sri Lankan contact", async ({ page }) => {
    await page.goto("/appointments");

    // Click "New Appointment" button
    await page.locator("button:has-text('New Appointment')").click();

    // Modal should be visible
    await expect(page.locator("text=Appointment").first()).toBeVisible();

    // Fill form
    await page.locator("input[placeholder*='Kasun Kalhara']").fill("Test E2E Patient");
    await page.locator("input[placeholder*='0771234567']").fill("0779998877");

    // Submit
    await page.locator("button:has-text('Save Appointment')").click();

    // Newly scheduled patient should appear in the table
    await expect(page.locator("text=Test E2E Patient").first()).toBeVisible({ timeout: 8000 });
  });
});
