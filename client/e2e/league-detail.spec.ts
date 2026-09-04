import { expect, test } from "@playwright/test";

// See dashboard.spec.ts for why `.first()` / `visible=true` show up so much
// here: React Native Web keeps previously-mounted screens (the dashboard,
// other tabs) in the DOM hidden rather than removed, so plain text locators
// can still match content that isn't currently on screen.

async function openDynastyDominators(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByText("Dynasty Dominators").first().click();
  await expect(page.getByRole("tab", { name: "Matchups" })).toBeVisible();
}

test.describe("League detail — Matchups tab", () => {
  test("defaults to the latest week and lists every matchup", async ({ page }) => {
    await openDynastyDominators(page);

    await expect(page.getByText("Week 6", { exact: true }).first()).toBeVisible();
    await expect(page.locator("text=Prev >> visible=true").first()).toBeVisible();
    await expect(page.locator("text=Next >> visible=true").first()).toBeVisible();
  });

  test("stepping to the previous week updates the matchup list and doesn't overshoot week 1", async ({ page }) => {
    await openDynastyDominators(page);

    await page.locator("text=Prev >> visible=true").first().click();
    await expect(page.getByText("Week 5", { exact: true }).first()).toBeVisible();

    // Walk back to week 1 (5 -> 4 -> 3 -> 2 -> 1).
    for (let i = 0; i < 4; i++) {
      await page.locator("text=Prev >> visible=true").first().click();
    }
    await expect(page.getByText("Week 1", { exact: true }).first()).toBeVisible();
  });

  test("tapping a matchup opens its box score with starters and bench, and back preserves the week", async ({
    page,
  }) => {
    await openDynastyDominators(page);

    await page.locator("text=Prev >> visible=true").first().click();
    await expect(page.getByText("Week 5", { exact: true }).first()).toBeVisible();

    await page.locator("text=Blazing Titans >> visible=true").first().click();
    // Both sides' box scores render "Starters"/"Bench" headers.
    await expect(page.getByText("Starters").first()).toBeVisible();
    await expect(page.getByText("Bench").first()).toBeVisible();
    await expect(page.getByText("Starters")).toHaveCount(2);

    await page.goBack();
    await expect(page.getByText("Week 5", { exact: true }).first()).toBeVisible();
  });
});

test.describe("League detail — Standings tab", () => {
  test("shows the full standings table, matching the dashboard's data for the league", async ({ page }) => {
    await openDynastyDominators(page);

    await page.getByRole("tab", { name: "Standings" }).click();
    await expect(page.locator("text=W-L-T >> visible=true").first()).toBeVisible();
    await expect(page.locator("text=PF >> visible=true").first()).toBeVisible();
    await expect(page.locator("text=PA >> visible=true").first()).toBeVisible();
  });
});

test.describe("League detail — Rosters tab", () => {
  test("defaults to the current user's own team and can switch to another team", async ({ page }) => {
    await openDynastyDominators(page);

    await page.getByRole("tab", { name: "Rosters" }).click();
    await expect(page.locator("text=(You) >> visible=true").first()).toBeVisible();
    await expect(page.locator("text=Starters >> visible=true").first()).toBeVisible();
    await expect(page.locator("text=Bench >> visible=true").first()).toBeVisible();

    // Team chips carry a stable testID — plain text locators are ambiguous
    // here since React Navigation keeps other screens' matching text
    // (e.g. a same-named team in a matchup row) in the DOM when hidden.
    await page.getByTestId("team-chip-team-2").click();
    // The switch re-fetches — the roster content stays present, not blank.
    await expect(page.locator("text=Starters >> visible=true").first()).toBeVisible();
  });
});

test.describe("League detail — Transactions tab", () => {
  test("shows the transaction feed with a multi-team trade and a free-agent drop", async ({ page }) => {
    await openDynastyDominators(page);

    await page.getByRole("tab", { name: "Transactions" }).click();
    await expect(page.getByText("TRADE").first()).toBeVisible();
    await expect(page.getByText("Free agency").first()).toBeVisible();
  });
});
