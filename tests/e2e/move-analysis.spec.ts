import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

async function expectOutcome(result: Locator) {
  await expect(result).toContainText(/Win\s+\d+(?:\.\d+)?%/);
  await expect(result).toContainText(/Push\s+\d+(?:\.\d+)?%/);
  await expect(result).toContainText(/Loss\s+\d+(?:\.\d+)?%/);
  await expect(result).toContainText(/Expected value\s+[+-]?\d+(?:\.\d+)?/);
}

async function expectExactStandardOutcomes(analysis: Locator) {
  await expect(analysis.getByRole("group", { name: "Hit" })).toContainText("Win 6.9%Push 0.3%Loss 92.8%Expected value -0.86");
  await expect(analysis.getByRole("group", { name: "Stand" })).toContainText("Win 55.0%Push 33.7%Loss 11.3%Expected value +0.44");
  await expect(analysis.getByRole("group", { name: "Double down" })).toContainText("Win 6.9%Push 0.3%Loss 92.8%Expected value -1.72");
}

test("shows analysis only after a move and includes each prior option", async ({ page }) => {
  await page.evaluate(() => {
    Math.random = () => 0.5;
  });
  await page.getByRole("button", { name: "Deal a hand" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toHaveCount(0);

  await page.getByRole("button", { name: "Hit" }).click();

  await expect(analysis).toBeVisible();
  await expect(analysis).toContainText("Selected move: Hit");
  for (const move of ["Stand", "Hit", "Double down"]) {
    const result = analysis.getByRole("group", { name: move });
    await expect(result).toContainText(/Win\s+\d+(?:\.\d+)?%/, { timeout: 15_000 });
    await expect(result).toContainText(/Push\s+\d+(?:\.\d+)?%/);
    await expect(result).toContainText(/Loss\s+\d+(?:\.\d+)?%/);
    await expect(result).toContainText(/Expected value\s+[+-]?\d+(?:\.\d+)?/);
  }
});

test("keeps hit feedback visible without showing the next best move", async ({ page }) => {
  await page.evaluate(() => {
    Math.random = () => 0.5;
  });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await page.getByRole("button", { name: "Hit" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toContainText("Selected move: Hit");
  await expect(page.getByRole("button", { name: "Stand" })).toBeEnabled();
  await expect(analysis).toContainText("Best prior move", { timeout: 15_000 });
  await expect(analysis).not.toContainText(/next best move|best next move/i);
});

test("shows mixed feedback after selecting Split on a splittable hand", async ({ page }) => {
  test.setTimeout(20_000);
  await page.evaluate(() => {
    Math.random = () => 0.04;
  });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await page.getByRole("button", { name: "Split" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toContainText("Hand 1");
  await expect(analysis).toContainText("Selected move: Split");
  const split = analysis.getByRole("group", { name: "Split" });
  await expect(split).toBeVisible({ timeout: 15_000 });
  await expectExactStandardOutcomes(analysis);
  await expectOutcome(split);
  await expect(analysis).toContainText(/Selected move grade: (?:Best move|Not the best move)/);
  await expect(split).toContainText(/approximate|estimate/i);
  for (const move of ["Hit", "Stand", "Double down"]) {
    await expect(analysis.getByRole("group", { name: move })).not.toContainText(/approximate|estimate/i);
  }
});

test("shows mixed feedback after selecting Stand on a splittable hand", async ({ page }) => {
  test.setTimeout(20_000);
  await page.evaluate(() => {
    Math.random = () => 0.04;
  });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await page.getByRole("button", { name: "Stand" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toContainText("Your decision");
  await expect(analysis).toContainText("Selected move: Stand");
  const split = analysis.getByRole("group", { name: "Split" });
  await expect(split).toBeVisible({ timeout: 15_000 });
  await expectExactStandardOutcomes(analysis);
  await expectOutcome(split);
  await expect(analysis).toContainText(/Selected move grade: (?:Best move|Not the best move)/);
  await expect(split).toContainText(/approximate|estimate/i);
  for (const move of ["Hit", "Stand", "Double down"]) {
    await expect(analysis.getByRole("group", { name: move })).not.toContainText(/approximate|estimate/i);
  }
});
