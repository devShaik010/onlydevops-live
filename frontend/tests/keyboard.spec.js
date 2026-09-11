import { test, expect } from "@playwright/test";

test("skip links focus content without changing topic or challenge routes", async ({ page }) => {
  for (const path of ["/#docker", "/practice#docker-upstream-port"]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    const before = page.url();
    // Reset the initial programmatic heading focus to test the page's tab order.
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
    });
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await expect(page).toHaveURL(before);
  }
});

test("mobile roadmap closes on Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle roadmap" });
  await toggle.click();
  const roadmap = page.getByRole("navigation", { name: "DevOps roadmap" });
  await expect(roadmap).toBeVisible();
  await roadmap.getByRole("button", { name: /Docker/ }).focus();
  await page.keyboard.press("Escape");
  await expect(roadmap).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
