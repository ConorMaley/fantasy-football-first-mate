import type { Page } from "@playwright/test";

export const ALEX_EMAIL = "alex@firstmate.local";
export const ALEX_PASSWORD = "sample-password-123";

export async function loginAsAlex(page: Page): Promise<void> {
  await page.goto("/password");
  // react-native-paper's TextInput doesn't associate its floating label with
  // the input accessibly on web, so getByLabel can't find it — fall back to
  // positional textboxes (email first, password second).
  const textboxes = page.getByRole("textbox");
  await textboxes.nth(0).fill(ALEX_EMAIL);
  await textboxes.nth(1).fill(ALEX_PASSWORD);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}
