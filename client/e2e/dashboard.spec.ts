import { expect, test } from "@playwright/test";

// React Native Web keeps previously-mounted screens in the DOM (hidden, not
// removed) when navigating within expo-router's Stack/Tabs, so text-based
// locators can still resolve matches on screens that are no longer visible.
// `.first()` here means "at least one match exists", not "exactly one".

test.describe("Dashboard", () => {
  test("shows active leagues with matchups and standings, excluding inactive leagues", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Your Leagues", { exact: true })).toBeVisible();

    // Both active leagues from the seed fixture appear...
    await expect(page.getByText("Dynasty Dominators").first()).toBeVisible();
    await expect(page.getByText("The Gridiron Gauntlet").first()).toBeVisible();

    // ...but the inactive league never does.
    await expect(page.getByText("Retired Legends")).toHaveCount(0);
  });

  test("each league card shows its latest-week matchups and full standings", async ({ page }) => {
    await page.goto("/");

    // Both league cards render a "Week N Matchups" header and a standings
    // table (W-L-T / PF / PA columns).
    await expect(page.getByText(/Week \d+ Matchups/).first()).toBeVisible();
    await expect(page.getByText("W-L-T").first()).toBeVisible();
    await expect(page.getByText("PF").first()).toBeVisible();
    await expect(page.getByText("PA").first()).toBeVisible();
    await expect(page.getByText(/Week \d+ Matchups/)).toHaveCount(2);
  });

  test("tapping a league card navigates into its First Mate view", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Dynasty Dominators").first().click();

    await expect(page.locator("text=SLEEPER · 2025 >> visible=true").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Matchups" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Standings" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Rosters" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Transactions" })).toBeVisible();
  });
});
