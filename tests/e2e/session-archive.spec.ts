import { expect, test, type Page } from "@playwright/test";

async function completeHand(page: Page) {
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByRole("status")).toContainText("Loss");
  await expect.poll(() => page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("twentyone-session-progress") ?? "{}");
    return progress.decisions;
  }), { timeout: 15_000 }).toBe(1);
}

async function openHistory(page: Page) {
  const button = page.getByRole("button", { name: "Session history" });
  await expect(button).toBeVisible({ timeout: 5_000 });
  await button.click();
  return page.getByRole("region", { name: "Session history" });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("archives a complete session summary, rules, hands, and time", async ({ page }) => {
  test.setTimeout(25_000);
  await completeHand(page);
  await page.getByRole("button", { name: "Reset session" }).click();

  const saved = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("twentyone-session-archive") ?? "[]");
    return sessions.at(-1);
  });

  expect(saved).toMatchObject({
    summary: { hands: 1, wins: 0, losses: 1, pushes: 0, decisions: 1 },
    rules: { deckCount: 6 },
    hands: [expect.any(Object)],
    archivedAt: expect.any(String),
  });
  expect(Number.isNaN(Date.parse(saved.archivedAt))).toBe(false);
});

test("saves cards, actions, grades, probabilities, and result for each hand", async ({ page }) => {
  test.setTimeout(25_000);
  await completeHand(page);
  await page.getByRole("button", { name: "Reset session" }).click();

  const hand = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("twentyone-session-archive") ?? "[]");
    return sessions.at(-1)?.hands?.[0];
  });

  expect(hand).toMatchObject({
    playerCards: expect.arrayContaining([
      expect.objectContaining({ rank: expect.any(String), suit: expect.any(String) }),
    ]),
    dealerCards: expect.arrayContaining([
      expect.objectContaining({ rank: expect.any(String), suit: expect.any(String) }),
    ]),
    actions: expect.arrayContaining([expect.objectContaining({
      action: "stand",
      grade: expect.any(String),
      probabilities: expect.any(Object),
    })]),
    result: "loss",
  });
});

test("shows saved sessions after a page reload", async ({ page }) => {
  test.setTimeout(25_000);
  await completeHand(page);
  await page.getByRole("button", { name: "Reset session" }).click();
  await page.reload();

  const history = await openHistory(page);
  await expect(history).toContainText("1 hand");
  await expect(history).toContainText("1 loss");
});

test("deletes saved history only after confirmation", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("twentyone-session-archive", JSON.stringify([{
    archivedAt: "2026-09-29T00:00:00.000Z",
    summary: { hands: 1, wins: 0, losses: 1, pushes: 0, decisions: 1, correctDecisions: 0 },
    rules: { deckCount: 6 },
    hands: [],
  }])));
  await page.reload();
  const history = await openHistory(page);

  await history.getByRole("button", { name: "Delete history" }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete saved history" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(history).toContainText("1 hand");

  await history.getByRole("button", { name: "Delete history" }).click();
  await page.getByRole("dialog", { name: "Delete saved history" })
    .getByRole("button", { name: "Delete history" }).click();
  await expect(history).toContainText("No saved sessions");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("twentyone-session-archive"))).toBeNull();
});

test("starts with an empty history when saved data is invalid", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("twentyone-session-archive", "not valid JSON"));
  await page.reload();

  await expect(page.getByRole("button", { name: "Deal a hand" })).toBeVisible();
  const history = await openHistory(page);
  await expect(history).toContainText("No saved sessions");
});
