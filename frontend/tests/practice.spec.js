import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const challengeName = "The deployment that returns 502";
const correctAnswer = "Point Nginx at api:8000, then reload its configuration.";

async function logOut(page) {
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
}

test("challenge search and tool filters combine and can be reset", async ({ page }) => {
  await page.goto("/practice");
  await page.getByLabel("Filter by tool").selectOption("docker");
  await expect(page.locator(".practice-card")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search challenges" }).fill("unmatched incident");
  await expect(page.getByRole("heading", { name: "No matching challenges." })).toBeVisible();
  await page.getByRole("button", { name: "Browse all challenges" }).click();
  await expect(page.locator(".practice-card")).toHaveCount(5);
  await expect(page.getByLabel("Filter by tool")).toHaveValue("all");
  await expect(page.getByRole("textbox", { name: "Search challenges" })).toHaveValue("");
});

test("completed diagnosis offers the next unsolved challenge", async ({ page }) => {
  await page.goto("/practice#docker-upstream-port");
  await page.getByRole("radio", { name: correctAnswer, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Next challenge" }).click();
  await expect(page).not.toHaveURL(/docker-upstream-port/);
  await expect(page.getByRole("button", { name: "Check answer" })).toBeDisabled();
});

test("workspace navigation and tool logos fit desktop and mobile", async ({ page }) => {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/practice");
    await expect(page.locator(".practice-card")).toHaveCount(5);
    await expect
      .poll(() =>
        page
          .locator(".practice-card-meta img")
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
      )
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const nav = page.getByRole("navigation", { name: "Workspace", exact: true });
    await expect(nav.getByRole("link", { name: "Practice", exact: true })).toHaveAttribute("aria-current", "page");
    await page.screenshot({ path: test.info().outputPath(`library-${width}.png`), fullPage: true });
    await nav.getByRole("link", { name: "Learning sheet" }).click();
    await expect(page.getByRole("heading", { name: "Linux." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`sheet-${width}.png`), fullPage: true });
  }
});

test("practice account creation imports results and sign-out clears the view", async ({
  page,
}) => {
  const username = `practice_ui_${Date.now()}`;
  try {
    await page.goto("/practice#docker-upstream-port");
    await page.getByRole("radio", { name: correctAnswer, exact: true }).check();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByRole("status")).toHaveText("Correct diagnosis");
    await page.getByRole("button", { name: "Save my progress" }).click();
    await expect(
      page.getByText(
        "Your guest practice results will be added to your account.",
      ),
    ).toBeVisible();
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page
      .getByLabel("Password", { exact: true })
      .fill("a-long-practice-password");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByText("Practice saved to your account"),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("Correct diagnosis");
    await logOut(page);
    await expect(
      page.getByText("Practice saved for this browser"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Check answer" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("heading", { name: "Why this works" }),
    ).toHaveCount(0);
  } finally {
    execFileSync("docker", [
      "compose",
      "exec",
      "-T",
      "api",
      "python",
      "-c",
      `import os,sys,psycopg
with psycopg.connect(os.environ['DATABASE_URL']) as db:
 db.execute('DELETE FROM practice_progress WHERE learner IN (SELECT id FROM accounts WHERE username = %s)', (sys.argv[1],))
 db.execute('DELETE FROM accounts WHERE username = %s', (sys.argv[1],))
 db.execute('DELETE FROM auth_limits WHERE bucket = %s', ('user:'+sys.argv[1],))`,
      username,
    ]);
  }
});

test("diagnose, review, retry, and restore the saved result", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Put your skills to work/ }).click();
  await expect(
    page.getByRole("heading", { name: "Follow the evidence." }),
  ).toBeVisible();
  await page.getByRole("button", { name: new RegExp(challengeName) }).click();
  await expect(page).toHaveURL(/practice#docker-upstream-port$/);
  await expect(
    page.getByRole("heading", { name: "Why this works" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: /localhost:9000/ }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toHaveText("Take another look");
  await expect(
    page.getByRole("heading", { name: "Verify the fix" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "All challenges", exact: true })
    .click();
  await page.getByRole("button", { name: "To review", exact: true }).click();
  await expect(page.locator(".practice-card")).toHaveCount(1);
  await page.getByRole("button", { name: new RegExp(challengeName) }).click();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("radio", { name: correctAnswer, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toHaveText("Correct diagnosis");
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Correct diagnosis");
  await page.getByRole("link", { name: "Review the Docker sheet" }).click();
  await expect(page.getByRole("heading", { name: "Docker." })).toBeVisible();
  await expect(page.locator("input[type=checkbox]:checked")).toHaveCount(0);
});

test("failed answer saves preserve selection and allow retry", async ({
  page,
}) => {
  await page.goto("/practice#docker-upstream-port");
  await page.route("**/api/practice/*/answer", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.getByRole("radio", { name: correctAnswer, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("alert")).toContainText("wasn’t saved");
  await expect(
    page.getByRole("radio", { name: correctAnswer, exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("heading", { name: "Why this works" }),
  ).toHaveCount(0);
  await page.unroute("**/api/practice/*/answer");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toHaveText("Correct diagnosis");
});

test("practice loading can recover and unknown links have a way back", async ({
  page,
}) => {
  await page.route("**/api/practice", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.goto("/practice");
  await expect(page.getByRole("alert")).toContainText("couldn’t load");
  await page.unroute("**/api/practice");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".practice-card")).toHaveCount(5);
  await page.goto("/practice#unknown");
  await expect(
    page.getByRole("heading", { name: "Challenge not found." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Browse challenges" }).click();
  await expect(page.locator(".practice-card")).toHaveCount(5);
});

test("mobile practice fits and browser history returns to the library", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice");
  await page.getByRole("button", { name: new RegExp(challengeName) }).click();
  await expect(
    page.getByRole("heading", { name: "Make the diagnosis" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("practice-mobile.png"),
    fullPage: true,
  });
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Follow the evidence." }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: `${challengeName}.` }),
  ).toBeVisible();
});
