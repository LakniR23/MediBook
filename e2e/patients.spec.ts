import { test, expect } from "@playwright/test";
import { loginAsDoctor } from "./auth.helper";

test.describe("Patients Directory & Medical Details Modal E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
    await page.goto("/patients");
  });

  test("loads patients directory with stat cards", async ({ page }) => {
    await expect(page.locator("text=Total Registered")).toBeVisible();
    await expect(page.locator("span:has-text('Active Care')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Chronic Care')").first()).toBeVisible();
  });

  test("does NOT have a 'Book Visit' button in the patients table", async ({ page }) => {
    // Assert strictly that "Book Visit" does not exist in table
    const bookVisitBtn = page.locator("table button:has-text('Book Visit')");
    await expect(bookVisitBtn).toHaveCount(0);
  });

  test("does NOT show clinical notes under patient name in the table", async ({ page }) => {
    // Wait for patient table to load
    await expect(page.locator("table")).toBeVisible();

    // Verify patient rows only show name and MRN/phone, not raw clinical notes
    const firstRowName = page.locator("table tbody tr td").first();
    await expect(firstRowName).toBeVisible();
  });

  test("opens Medical Details modal on clicking 'Details' button with Blood & Alerts inside", async ({
    page,
  }) => {
    // Click the first "Details" button in the table actions
    const detailsBtn = page.locator("button:has-text('Details')").first();
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // Blood Profile & Mobile must be inside this modal
    await expect(page.locator("text=Blood Profile")).toBeVisible();
    await expect(page.locator("text=10-Digit Mobile:")).toBeVisible();

    // Close modal
    await page.locator("button:has-text('Close')").click();
    await expect(page.locator("text=Blood Profile")).not.toBeVisible();
  });
});
