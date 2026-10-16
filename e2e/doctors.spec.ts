import { test, expect } from "@playwright/test";
import { loginAsDoctor } from "./auth.helper";

test.describe("Doctors Management & Shifts E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
    await page.goto("/doctors");
  });

  test("loads the doctors page with dynamic stat cards", async ({ page }) => {
    // Stat cards should be rendered
    await expect(page.locator("text=Current Shift (Auto)")).toBeVisible();
    await expect(page.locator("text=LIVE")).toBeVisible();
    await expect(page.locator("text=Total Staff")).toBeVisible();
    await expect(page.locator("text=Active On Duty")).toBeVisible();
  });

  test("displays 4 shift filter tabs with counts and current shift button", async ({ page }) => {
    await expect(page.locator("button:has-text('All Staff')")).toBeVisible();
    await expect(page.locator("button[title*='Morning Shift']")).toBeVisible();
    await expect(page.locator("button[title*='Afternoon Shift']")).toBeVisible();
    await expect(page.locator("button[title*='Evening Shift']")).toBeVisible();
    await expect(page.locator("button[title*='Night Shift']")).toBeVisible();
  });

  test("filters doctors roster when clicking Morning shift tab", async ({ page }) => {
    const morningTab = page.locator("button[title*='Morning Shift']");
    await morningTab.click();

    // Doctor card heading should be visible
    await expect(page.locator("h3:has-text('Dr.')").first()).toBeVisible();
  });

  test("clicking 'View Shift Appointments' redirects to /appointments with doctor filter", async ({
    page,
  }) => {
    // Find the first "View Shift Appointments" link
    const viewAppointmentsBtn = page.locator("a:has-text('View Shift Appointments')").first();
    await expect(viewAppointmentsBtn).toBeVisible();

    await viewAppointmentsBtn.click();
    await page.waitForURL("**/appointments?doctor=*");

    expect(page.url()).toContain("/appointments?doctor=");
    await expect(page.locator("table")).toBeVisible();
  });
});
