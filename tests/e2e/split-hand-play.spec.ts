import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Math.random = () => 0.04;
  });
  await page.getByRole("button", { name: "Deal a hand" }).click();
});

test("shows split hands and moves the active hand before dealer play", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Split" })).toBeEnabled();
  await page.getByRole("button", { name: "Split" }).click();

  await expect(page.getByLabel("Player hand 1, active")).toBeVisible();
  await expect(page.getByLabel("Player hand 2")).toBeVisible();
  await expect(page.getByLabel("Player hand 1, active").getByRole("img")).toHaveCount(2);
  await expect(page.getByLabel("Player hand 2").getByRole("img")).toHaveCount(2);

  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByLabel("Player hand 2, active")).toBeVisible();
  await expect(page.getByLabel("Hidden card")).toBeVisible();

  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByLabel("Hidden card")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(2);
});

test("pages one hand at a time on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Split" })).toBeEnabled();
  await page.getByRole("button", { name: "Split" }).click();

  const pages = page.getByRole("navigation", { name: "Player hand pages" });
  await expect(page.getByRole("button", { name: "Stand" })).toBeEnabled();
  await expect(pages).toContainText("Hand 1 of 2");
  await pages.getByRole("button", { name: "Next player hands" }).click();
  const trackTransforms = await page.locator(".player-hands-track").evaluate(async (track) => {
    const transforms: string[] = [];
    for (let frame = 0; frame < 6; frame += 1) {
      transforms.push(getComputedStyle(track).transform);
      await new Promise(requestAnimationFrame);
    }
    return transforms;
  });
  await expect(pages).toContainText("Hand 2 of 2");
  await expect(page.getByRole("button", { name: "Return to active hand" })).toBeVisible();
  expect(new Set(trackTransforms).size).toBeGreaterThan(1);
  await expect.poll(() => page.locator(".card").evaluateAll((cards) => cards.every((card) => card.getAnimations().length === 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.getByRole("button", { name: "Return to active hand" }).click();
  await expect(pages).toContainText("Hand 1 of 2");
});

test("pages two hands at a time and follows the active hand on larger screens", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 960 });
  await page.goto("/");
  await page.evaluate(() => { Math.random = () => 0.15; });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await expect(page.getByRole("button", { name: "Split" })).toBeEnabled();
  await page.getByRole("button", { name: "Split" }).click();
  await expect(page.getByRole("button", { name: "Split" })).toBeEnabled();
  await page.getByRole("button", { name: "Split" }).click();

  const pages = page.getByRole("navigation", { name: "Player hand pages" });
  await expect(pages).toContainText("Hands 1-2 of 3");
  await expect(page.getByRole("button", { name: "Stand" })).toBeEnabled();
  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByLabel("Player hand 2, active")).toBeVisible();
  await expect(page.getByRole("button", { name: "Stand" })).toBeEnabled();
  await page.getByRole("button", { name: "Stand" }).click();
  await expect(page.getByLabel("Player hand 3, active")).toBeVisible();
  await expect(pages).toContainText("Hand 3 of 3");

  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(pages).toContainText("Hand 3 of 3");
});

test("changes mobile hand pages without motion when reduced motion is active", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Split" })).toBeEnabled();
  await page.getByRole("button", { name: "Split" }).click();

  const pages = page.getByRole("navigation", { name: "Player hand pages" });
  await pages.getByRole("button", { name: "Next player hands" }).click();
  const trackTransforms = await page.locator(".player-hands-track").evaluate(async (track) => {
    const transforms: string[] = [];
    for (let frame = 0; frame < 3; frame += 1) {
      transforms.push(getComputedStyle(track).transform);
      await new Promise(requestAnimationFrame);
    }
    return transforms;
  });
  await expect(pages).toContainText("Hand 2 of 2");
  expect(new Set(trackTransforms).size).toBe(1);
});
