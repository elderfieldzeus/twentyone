import { expect, test } from "@playwright/test";

test("animates cards and locks controls during a transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Deal a hand" }).click();

  await expect(page.getByLabel("Blackjack table")).toHaveAttribute("data-motion", "standard");
  await expect(page.getByRole("button", { name: "Hit" })).toBeDisabled();
  await expect.poll(() => page.locator(".card").evaluateAll((cards) => cards.some((card) => card.getAnimations().length > 0))).toBe(true);
  await expect(page.getByRole("button", { name: "Hit" })).toBeEnabled();
});

test("removes nonessential movement in reduced-motion mode", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Deal a hand" }).click();

  await expect(page.getByLabel("Blackjack table")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("button", { name: "Hit" })).toBeEnabled();
  await expect.poll(() => page.locator(".card").evaluateAll((cards) => cards.every((card) => card.getAnimations().length === 0))).toBe(true);
});
