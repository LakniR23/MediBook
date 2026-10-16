import { test, expect } from "@playwright/test";
import { loginAsDoctor } from "./auth.helper";

test.describe("MediBook Siri/Alexa-style Voice AI (Medi) E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("button[data-voice-ball='true'][data-hydrated='true']");
  });

  test("renders prominent 3D Voice Assistant mic ball without chat window or text label", async ({
    page,
  }) => {
    // Floating 3D microphone ball button
    const floatMicBall = page.locator("button[aria-label='Voice Assistant Microphone']");
    await expect(floatMicBall).toBeVisible();

    // Verify text pill "Voice Assistant" is completely removed from the UI
    const voiceAssistantPill = page.locator("button:has-text('Voice Assistant')");
    await expect(voiceAssistantPill).toHaveCount(0);

    // Verify NO chat window or text input exists on screen
    const chatInput = page.locator("input[placeholder*='Speak or type']");
    await expect(chatInput).toHaveCount(0);
  });

  test("activates voice listening when tapping the 3D mic ball without opening any chat box", async ({
    page,
  }) => {
    const floatMicBall = page.locator("button[aria-label='Voice Assistant Microphone']");
    await floatMicBall.click();

    // The 3D ball activates listening mode
    await expect(floatMicBall).toHaveAttribute("data-listening", "true");

    // Sleek Voice HUD indicates Medi is listening (NO chat console, NO example text)
    await expect(page.locator("text=Medi is listening...")).toBeVisible();
    await expect(page.locator("input[placeholder*='Speak or type']")).toHaveCount(0);
  });

  test("starts conversation via wake word 'Medi' or 'Hey Medi'", async ({ page }) => {
    // Trigger wake word greeting
    await page.evaluate(() => {
      (window as any).__medibookVoiceCommand("Hey Medi");
    });

    // Voice HUD should display Medi's introduction
    await expect(page.locator("text=Yes, I am Medi. How can I help you today?")).toBeVisible();
  });

  test("answers doctor appointment query with count and brief details", async ({ page }) => {
    // Ask for Dr. Nimal's appointments
    await page.evaluate(async () => {
      await (window as any).__medibookVoiceCommand("what are the appointments for dr nimal today");
    });

    // HUD should report the count and details
    await expect(page.locator("text=Dr. Nimal Perera has").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Kasun Kalhara").first()).toBeVisible({ timeout: 8000 });
  });

  test("answers patient Kavindu blood type and clinical alert query", async ({ page }) => {
    // Ask for patient Kavindu's blood type
    await page.evaluate(async () => {
      await (window as any).__medibookVoiceCommand("what is patient kavindu's blood type");
    });

    // Voice HUD should answer B+ and clinical alert
    await expect(page.locator("text=blood type is B+").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Penicillin allergy").first()).toBeVisible({ timeout: 8000 });
  });

  test("executes navigation command via Voice AI ('when the patient's page')", async ({ page }) => {
    // Test natural variation that user spoke
    await page.evaluate(() => {
      (window as any).__medibookVoiceCommand("when the patient's page");
    });

    // Should navigate to /patients
    await page.waitForURL("**/patients");
    expect(page.url()).toContain("/patients");

    // Spoken response should appear in the floating voice HUD
    await expect(
      page.locator("text=Navigating to Patient directory.")
    ).toBeVisible();
  });

  test("executes action command via Voice AI ('Schedule appointment')", async ({ page }) => {
    // Trigger voice action command
    await page.evaluate(() => {
      (window as any).__medibookVoiceCommand("Schedule appointment");
    });

    // Should navigate to appointments and open modal
    await page.waitForURL("**/appointments");
    expect(page.url()).toContain("/appointments");

    // Modal should be opened automatically by voice action
    await expect(page.locator("text=Appointment").first()).toBeVisible({ timeout: 6000 });
  });

  test("greets and introduces Medi on login", async ({ page }) => {
    // Simulate login greeting trigger for doctor
    await page.evaluate(() => {
      (window as any).__medibookGreetLogin("Dr. Nimal Perera");
    });
    await expect(page.locator("text=Hello Dr. Nimal Perera, I am Medi. How can I help you today?")).toBeVisible();

    // Simulate login greeting trigger for nurse (should NOT prepend Dr.)
    await page.evaluate(() => {
      (window as any).__medibookGreetLogin("Nurse Sanduni Fernando");
    });
    await expect(page.locator("text=Hello Nurse Sanduni Fernando, I am Medi. How can I help you today?")).toBeVisible();
  });

  test("does NOT display Voice Assistant on /login or /register pages", async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/login");
    await expect(page.locator("button[data-voice-ball='true']")).toHaveCount(0);
    await expect(page.locator("[data-voice-widget='true']")).toHaveCount(0);

    await page.goto("/register");
    await expect(page.locator("button[data-voice-ball='true']")).toHaveCount(0);
    await expect(page.locator("[data-voice-widget='true']")).toHaveCount(0);
  });
});
