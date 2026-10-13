import { test, expect } from "@playwright/test";

test.describe("MediBook Appointment Management E2E", () => {
  test("loads the dashboard with stats and appointment table", async ({ page }) => {
    await page.goto("/");

    // Verify Brand title & Header
    await expect(page.locator("text=MediBook").first()).toBeVisible();
    await expect(page.locator("text=Total Scheduled")).toBeVisible();

    // Verify at least one seeded doctor/appointment is visible
    await expect(page.locator("text=Dr. Nimal Perera").first()).toBeVisible();
  });

  test("performs natural language search and filters list", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.locator("input[placeholder*='plain English']");
    await searchInput.fill("cancelled appointments with Dr. Perera next week");
    await page.locator("button:has-text('Search')").click();

    // Interpretation banner should appear
    await expect(page.locator("text=Parsed").first()).toBeVisible({ timeout: 5000 });

    // Status badge for Cancelled should be visible in table
    await expect(page.locator("text=Cancelled").first()).toBeVisible();
  });

  test("creates a new appointment successfully", async ({ page }) => {
    await page.goto("/");

    // Click "New Appointment" button
    await page.locator("button:has-text('New Appointment')").click();

    // Modal should be visible
    await expect(page.locator("text=Schedule New Appointment")).toBeVisible();

    // Fill form
    await page.locator("input[placeholder*='Arthur Dent']").fill("Test E2E Patient");
    await page.locator("input[placeholder*='+1 (555)']").fill("+1 (555) 999-0000");

    // Select doctor
    await page.locator("select").first().selectOption({ index: 1 });

    // Submit
    await page.locator("button:has-text('Create Appointment')").click();

    // Toast or table item should appear
    await expect(page.locator("text=Test E2E Patient").first()).toBeVisible({ timeout: 6000 });
  });

  test("edits an appointment", async ({ page }) => {
    await page.goto("/");

    // Find first edit button
    const editButton = page.locator("button[title='Edit appointment']").first();
    await editButton.click();

    await expect(page.locator("text=Edit Appointment")).toBeVisible();

    // Modify clinical notes
    const notesInput = page.locator("textarea");
    await notesInput.fill("Updated clinical notes via E2E test");

    await page.locator("button:has-text('Save Changes')").click();

    // Verify toast notification
    await expect(page.locator("text=Appointment updated successfully")).toBeVisible({ timeout: 5000 });
  });

  test("deletes an appointment", async ({ page }) => {
    await page.goto("/");

    // Click delete on the first appointment
    const deleteButton = page.locator("button[title='Delete appointment']").first();
    await deleteButton.click();

    await expect(page.locator("text=Delete Appointment?")).toBeVisible();

    // Confirm deletion
    await page.locator("button:has-text('Delete Appointment')").click();

    // Verify success toast
    await expect(page.locator("text=Appointment deleted successfully")).toBeVisible({ timeout: 5000 });
  });
});
