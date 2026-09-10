import { test, expect } from "@playwright/test";
test("save, reload, filter, navigate, and undo", async ({ page }) => {
  await page.goto("/");
  const checkbox = page.getByRole("checkbox", { name: "ls -a", exact: true });
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeEnabled();
  await page.reload();
  await expect(checkbox).toBeChecked();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("checkbox").click();
  await expect(page.getByText("Your first check is waiting.")).toBeVisible();
  await page.getByRole("button", { name: "Show all items" }).click();
  await page.getByRole("textbox").fill("ls -lh");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("button", { name: "04 Docker" }).click();
  await expect(
    page.getByRole("heading", { name: "Docker.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "docker run", exact: true }),
  ).toBeVisible();
});
test("failed saves preserve unchecked state and show an error", async ({
  page,
}) => {
  await page.goto("/");
  await page.route("**/api/progress/**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.getByRole("checkbox", { name: "ls -a", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("wasn’t saved");
  await expect(
    page.getByRole("checkbox", { name: "ls -a", exact: true }),
  ).not.toBeChecked();
});
test("mobile roadmap and narrow layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Linux." })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Toggle roadmap" }).click();
  await page.getByRole("button", { name: "08 GitHub Actions" }).click();
  await expect(
    page.getByRole("heading", { name: "GitHub Actions." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/onlydevops-mobile.png", fullPage: true });
});
test("desktop layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await expect(
    page.getByRole("checkbox", { name: "ls -a", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/onlydevops-desktop.png",
    fullPage: true,
  });
});

test("filtered sections can collapse and expand", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox").fill("ls -a");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("button", { name: "Collapse all" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Expand all" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
});

test("loading failure can be retried", async ({ page }) => {
  await page.route("**/api/sheet", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("couldn’t load");
  await page.unroute("**/api/sheet");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Linux." })).toBeVisible();
});
