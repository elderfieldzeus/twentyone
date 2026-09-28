import { expect, test } from "@playwright/test";

test("shows an accessible casino table and desktop analysis area", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const table = page.getByRole("region", { name: "Blackjack table" });
  const analysis = page.getByRole("complementary", { name: "Move analysis" });

  await expect(page.getByRole("heading", { name: "Dealer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your hand" })).toBeVisible();
  await expect(table.getByRole("img")).toHaveCount(0);
  await expect(table).toBeVisible();
  await expect(analysis).toBeVisible();

  const tableBox = await table.boundingBox();
  const analysisBox = await analysis.boundingBox();
  expect(analysisBox?.x).toBeGreaterThan((tableBox?.x ?? 0) + (tableBox?.width ?? 0));
});

test("places analysis below the table on a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const tableBox = await page.getByRole("region", { name: "Blackjack table" }).boundingBox();
  const analysisBox = await page.getByRole("complementary", { name: "Move analysis" }).boundingBox();

  expect(analysisBox?.y).toBeGreaterThan((tableBox?.y ?? 0) + (tableBox?.height ?? 0));
});

test("hides only the corner suit on mobile cards", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();

  const card = page.getByLabel("Player cards").locator(".card").first();
  await expect(card.locator(".card-corner")).toHaveCSS("display", "flex");
  await expect(card.locator(".card-corner strong")).toBeVisible();
  await expect(card.locator(".card-corner span")).toHaveCSS("display", "none");
  await expect(card.locator(".card-suit")).toHaveCSS("display", "grid");

  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(card.locator(".card-corner")).toHaveCSS("display", "flex");
  await expect(card.locator(".card-corner span")).toHaveCSS("display", "block");
  await expect(card.locator(".card-suit")).toHaveCSS("display", "grid");
});
