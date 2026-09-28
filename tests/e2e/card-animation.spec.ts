import { expect, test } from "@playwright/test";

test("animates cards and locks controls during a transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.waitForTimeout(100);
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();

  await expect(page.getByLabel("Blackjack table")).toHaveAttribute("data-motion", "standard");
  await expect(page.getByRole("button", { name: "Hit" })).toBeDisabled();
  await expect.poll(() => page.locator(".card").evaluateAll((cards) => cards.some((card) => card.getAnimations().length > 0))).toBe(true);
  await expect(page.getByRole("button", { name: "Hit" })).toBeEnabled();
});

test("deals the opening cards one at a time", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.waitForTimeout(100);
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();

  const openingCards = page.locator("[data-deal-order]");
  await expect(openingCards).toHaveCount(4);
  for (const order of [0, 1, 2, 3]) {
    await expect(page.locator(`[data-deal-order="${order}"]`)).toHaveCount(1);
  }

  await expect.poll(async () => {
    const firstOpacity = Number(await page.locator('[data-deal-order="0"]').evaluate((card) => getComputedStyle(card).opacity));
    const lastOpacity = Number(await page.locator('[data-deal-order="3"]').evaluate((card) => getComputedStyle(card).opacity));
    return firstOpacity > lastOpacity;
  }).toBe(true);
  await expect(page.getByRole("button", { name: "Hit" })).toBeEnabled();
});

test("removes nonessential movement in reduced-motion mode", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(100);
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();

  await expect(page.getByLabel("Blackjack table")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("button", { name: "Hit" })).toBeEnabled();
  await expect.poll(() => page.locator(".card").evaluateAll((cards) => cards.every((card) => card.getAnimations().length === 0))).toBe(true);
});

test("keeps separate front and back faces during the dealer flip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.waitForTimeout(100);
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();

  const holeCard = page.getByLabel("Dealer cards").locator(".card").nth(1);
  await expect(holeCard.locator(".card-face-front")).toHaveCount(1);
  await expect(holeCard.locator(".card-face-back")).toHaveCount(1);
  await expect(holeCard.locator(".card-face-front")).toHaveCSS("backface-visibility", "hidden");

  await page.getByRole("button", { name: "Stand" }).click();
  await expect(holeCard).toHaveAttribute("aria-label", /.+ of .+/);
  await expect(holeCard.locator(".card-face-back")).toHaveCount(1);
});

test("removes every finished card together before the next deal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.waitForTimeout(100);
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await page.getByRole("button", { name: "Stand" }).click();
  await page.getByRole("button", { name: "Deal next hand" }).click();

  await expect(page.getByLabel("Blackjack table")).toHaveAttribute("data-game-state", "clearing");
  await expect.poll(() => page.locator(".card").evaluateAll((cards) => cards.length > 0 && cards.every((card) => card.getAnimations().length > 0))).toBe(true);
  await expect(page.getByLabel("Blackjack table")).toHaveAttribute("data-game-state", "playing");
  await expect(page.locator("[data-deal-order]")).toHaveCount(4);
});
