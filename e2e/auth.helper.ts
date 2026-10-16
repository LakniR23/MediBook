import { Page } from "@playwright/test";

export const MOCK_USER_SESSION = {
  uid: "usr-nimal-01",
  displayName: "Dr. Nimal Perera",
  email: "dr.nimal.perera@gmail.com",
  phoneNumber: "0771234567",
  address: "12 Galle Road, Colombo 03",
  role: "Consultant Physician",
  slmcReg: "SLMC-4921",
  hospital: "National Hospital of Sri Lanka",
  bio: "Lead Consultant Physician with 18+ years of clinical service across NHSL Colombo.",
  isDemo: true,
};

export async function loginAsDoctor(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem("medibook_active_session", JSON.stringify(session));
  }, MOCK_USER_SESSION);
}

