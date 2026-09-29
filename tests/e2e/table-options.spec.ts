import { expect, test, type Page } from "@playwright/test";

async function openOptions(page: Page) {
  await page.getByRole("button", { name: "Table options" }).click({ timeout: 5_000 });
  return page.getByRole("dialog", { name: "Table options" });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows current shoe and dealer options before changes", async ({ page }) => {
  const options = await openOptions(page);

  await expect(options.getByRole("combobox", { name: "Deck count" })).toHaveValue("6");
  await expect(options.getByRole("checkbox", { name: "Shuffle after each hand" })).toBeChecked();
  await expect(options.getByRole("checkbox", { name: "Dealer hole card" })).toBeChecked();
  await expect(options.getByRole("combobox", { name: "Soft 17" })).toHaveValue("stand");
});

test("shows current split and payout options before changes", async ({ page }) => {
  const options = await openOptions(page);

  await expect(options.getByRole("combobox", { name: "Maximum split hands" })).toHaveValue("4");
  await expect(options.getByRole("checkbox", { name: "Double after split" })).toBeChecked();
  await expect(options.getByRole("checkbox", { name: "Repeated ace splits" })).not.toBeChecked();
  await expect(options.getByRole("combobox", { name: "Blackjack payout" })).toHaveValue("3:2");
});

test("archives the current session and clears the table when options change", async ({ page }) => {
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await expect(page.getByLabel("Player cards").getByRole("img")).toHaveCount(2);

  const options = await openOptions(page);
  await options.getByRole("combobox", { name: "Deck count" }).selectOption("1");
  await options.getByRole("button", { name: "Apply options" }).click();

  await expect(page.getByRole("status")).toContainText("Session archived");
  await expect(page.getByLabel("Player cards").getByRole("img")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Deal a hand" })).toBeVisible();
});

test("uses changed options for game play and move analysis", async ({ page }) => {
  const options = await openOptions(page);
  await options.getByRole("combobox", { name: "Deck count" }).selectOption("1");
  await options.getByRole("checkbox", { name: "Dealer hole card" }).uncheck();
  await options.getByRole("combobox", { name: "Soft 17" }).selectOption("hit");
  await options.getByRole("button", { name: "Apply options" }).click();

  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole("button", { name: "Deal a hand" }).click();
  await expect(page.getByLabel("Dealer cards").getByRole("img")).toHaveCount(1);
  await expect(page.getByLabel("Hidden card")).toHaveCount(0);
  await page.getByRole("button", { name: "Hit" }).click();

  const analysis = page.getByRole("region", { name: "Move analysis" });
  await expect(analysis).toContainText("1 deck", { timeout: 15_000 });
  await expect(analysis).toContainText("H17");
  await expect(analysis).toContainText("No hole card");
});
