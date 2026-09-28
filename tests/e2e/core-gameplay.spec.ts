import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Math.random = () => 0.5;
  });
});

test("deals a hand and enables only valid controls", async ({ page }) => {
  await page.getByRole("button", { name: "Deal a hand" }).press("Enter");

  await expect(page.getByRole("button", { name: "Hit" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Stand" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Double down" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Deal a hand" })).toHaveCount(0);

  await page.getByRole("button", { name: "Hit" }).click();
  await expect(page.getByLabel("Player cards").getByRole("img")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Double down" })).toHaveCount(0);
});

test("stands and reveals the completed dealer hand", async ({ page }) => {
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await expect(page.getByLabel("Hidden card")).toBeVisible();

  await page.getByRole("button", { name: "Stand" }).click();

  await expect(page.getByLabel("Hidden card")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(/Win|Loss|Push|Blackjack/);
});

test("doubles for one card and completes the hand", async ({ page }) => {
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await page.getByRole("button", { name: "Double down" }).click();

  await expect(page.getByLabel("Player cards").getByRole("img")).toHaveCount(3);
  await expect(page.getByRole("status")).toBeVisible();
});
