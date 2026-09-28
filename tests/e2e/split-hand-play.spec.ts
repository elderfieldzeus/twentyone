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
