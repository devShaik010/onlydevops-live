import { test, expect } from "@playwright/test";

test("theme follows the system until a saved choice overrides it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("navigation", { name: "Workspace", exact: true }).getByRole("link", { name: "Practice", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f7f8fa");
});

test("theme remains usable without storage and honors reduced motion", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("unavailable"); };
    Storage.prototype.setItem = () => { throw new Error("unavailable"); };
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/practice");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Save my progress" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("both themes fit sheet, practice, evidence and account screens", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path] of [["sheet", "/"], ["practice", "/practice"], ["evidence", "/practice#docker-upstream-port"]]) {
        await page.goto(path);
        await expect(page.locator("main h1")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ animations: "disabled", path: test.info().outputPath(`${name}-${theme}-${width}.png`), fullPage: true });
      }
      await page.getByRole("button", { name: "Save my progress" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.screenshot({ animations: "disabled", path: test.info().outputPath(`account-${theme}-${width}.png`) });
    }
  }
});
