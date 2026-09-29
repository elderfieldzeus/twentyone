import { expect, test, type Locator, type Page } from "@playwright/test";

function progress(page: Page): Locator {
  return page.getByRole("region", { name: "Session progress" });
}

async function dealKnownHand(page: Page) {
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows every current session counter", async ({ page }) => {
  const current = progress(page);

  await expect(current).toBeVisible({ timeout: 5_000 });
  await expect(current).toContainText(/Hands\s+0/);
  await expect(current).toContainText(/Wins\s+0/);
  await expect(current).toContainText(/Losses\s+0/);
  await expect(current).toContainText(/Pushes\s+0/);
  await expect(current).toContainText(/Correct moves\s+0%/);
});

test("counts a completed hand result exactly once", async ({ page }) => {
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByRole("status")).toContainText("Loss");

  const current = progress(page);
  await expect(current).toContainText(/Hands\s+1/);
  await expect(current).toContainText(/Wins\s+0/);
  await expect(current).toContainText(/Losses\s+1/);
  await expect(current).toContainText(/Pushes\s+0/);
  await page.waitForTimeout(1_000);
  await expect(current).toContainText(/Hands\s+1/);
  await expect(current).toContainText(/Losses\s+1/);
});

test("counts each graded decision exactly once", async ({ page }) => {
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Hit" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toContainText("Selected move: Hit");
  await expect(analysis).toContainText("Selected move grade: Best move", { timeout: 15_000 });
  await expect(progress(page)).toContainText(/Correct moves\s+100%/);

  await page.getByRole("button", { name: "Stand" }).click();
  await expect(analysis).toContainText("Selected move: Stand");
  await expect(analysis).toContainText("Selected move grade: Not the best move", { timeout: 15_000 });
  await expect(progress(page)).toContainText(/Correct moves\s+50%/);
  await page.waitForTimeout(1_000);
  await expect(progress(page)).toContainText(/Correct moves\s+50%/);
});

test("counts fast consecutive graded moves exactly once", async ({ page }) => {
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Hit" }).click();
  await page.getByRole("button", { name: "Stand" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toContainText("Selected move: Stand");
  await expect(analysis).toContainText("Selected move grade: Not the best move", { timeout: 15_000 });
  await expect(progress(page)).toContainText(/Correct moves\s+50%/);
  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("twentyone-session-progress") ?? "{}");
    return { decisions: stored.decisions, correctDecisions: stored.correctDecisions };
  })).toEqual({ decisions: 2, correctDecisions: 1 });
  await page.waitForTimeout(1_000);
  await expect(progress(page)).toContainText(/Correct moves\s+50%/);
});

test("stores a pending grade without showing stale feedback on the next hand", async ({ page }) => {
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await page.getByRole("button", { name: "Deal next hand" }).click();

  await expect(page.getByLabel("Player cards").getByRole("img")).toHaveCount(2);
  await expect(page.getByRole("region", { name: "Move analysis" })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("twentyone-session-progress") ?? "{}");
    return { decisions: stored.decisions, correctDecisions: stored.correctDecisions };
  }), { timeout: 15_000 }).toEqual({ decisions: 1, correctDecisions: 0 });
  await expect(page.getByRole("region", { name: "Move analysis" })).toHaveCount(0);
  await page.waitForTimeout(1_000);
  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("twentyone-session-progress") ?? "{}");
    return { decisions: stored.decisions, correctDecisions: stored.correctDecisions };
  })).toEqual({ decisions: 1, correctDecisions: 0 });
});

test("recovers a pending Stand grade after reload without stale feedback", async ({ page }) => {
  test.setTimeout(25_000);
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await page.reload();

  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("twentyone-session-progress") ?? "{}");
    return { decisions: stored.decisions, correctDecisions: stored.correctDecisions };
  }), { timeout: 15_000 }).toEqual({ decisions: 1, correctDecisions: 0 });
  await expect(progress(page)).toContainText(/Correct moves\s+0%/);
  await expect(page.getByRole("region", { name: "Move analysis" })).toHaveCount(0);
  await page.waitForTimeout(1_000);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("twentyone-session-progress") ?? "{}").decisions)).toBe(1);
});

test("archives a pending Stand grade once before reset", async ({ page }) => {
  test.setTimeout(25_000);
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await page.getByRole("button", { name: "Reset session" }).click();

  await expect.poll(() => page.evaluate(() => {
    const archive = JSON.parse(localStorage.getItem("twentyone-session-archive") ?? "[]");
    const stored = archive.at(-1)?.progress ?? {};
    return { archiveCount: archive.length, decisions: stored.decisions, correctDecisions: stored.correctDecisions };
  }), { timeout: 15_000 }).toEqual({ archiveCount: 1, decisions: 1, correctDecisions: 0 });
  await expect(progress(page)).toContainText(/Hands\s+0/);
  await expect(progress(page)).toContainText(/Correct moves\s+0%/);
  await expect(page.getByRole("region", { name: "Move analysis" })).toHaveCount(0);
});

test("archives a pending Stand grade once before applying options", async ({ page }) => {
  test.setTimeout(25_000);
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await page.getByRole("button", { name: "Table options" }).click();
  const options = page.getByRole("dialog", { name: "Table options" });
  await options.getByRole("combobox", { name: "Deck count" }).selectOption("1");
  await options.getByRole("button", { name: "Apply options" }).click();

  await expect.poll(() => page.evaluate(() => {
    const archive = JSON.parse(localStorage.getItem("twentyone-session-archive") ?? "[]");
    const stored = archive.at(-1)?.progress ?? {};
    return { archiveCount: archive.length, decisions: stored.decisions, correctDecisions: stored.correctDecisions };
  }), { timeout: 15_000 }).toEqual({ archiveCount: 1, decisions: 1, correctDecisions: 0 });
  await expect(progress(page)).toContainText(/Hands\s+0/);
  await expect(progress(page)).toContainText(/Correct moves\s+0%/);
  await expect(page.getByRole("region", { name: "Move analysis" })).toHaveCount(0);
});

test("keeps current progress after a page reload", async ({ page }) => {
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByRole("status")).toContainText("Loss");
  await expect(progress(page)).toContainText(/Hands\s+1/);

  await page.reload();

  await expect(progress(page)).toContainText(/Hands\s+1/);
  await expect(progress(page)).toContainText(/Losses\s+1/);
});

test("archives and clears current progress on reset", async ({ page }) => {
  await dealKnownHand(page);
  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByRole("status")).toContainText("Loss");
  await expect(progress(page)).toContainText(/Hands\s+1/);

  await page.getByRole("button", { name: "Reset session" }).click();

  await expect(page.getByRole("status")).toContainText("Session archived");
  await expect(progress(page)).toContainText(/Hands\s+0/);
  await expect(progress(page)).toContainText(/Wins\s+0/);
  await expect(progress(page)).toContainText(/Losses\s+0/);
  await expect(progress(page)).toContainText(/Pushes\s+0/);
  await expect(progress(page)).toContainText(/Correct moves\s+0%/);
});
