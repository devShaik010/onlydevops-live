import { test, expect } from "@playwright/test";

test("continue opens and focuses the next unfinished item through filters", async ({
  page,
}) => {
  await page.goto("/");
  const first = page.getByRole("checkbox", { name: "ls", exact: true });
  await first.click();
  await expect(first).toBeChecked();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await page.getByRole("textbox").fill("no matches");
  await page.getByRole("button", { name: "Continue learning" }).click();
  await expect(
    page.getByRole("checkbox", { name: "ls -a", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "All items", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("textbox")).toHaveValue("");
});

test("restores topic, sections, and scroll on reload and a fresh visit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "04 Docker" }).click();
  await page.getByRole("button", { name: "Expand all", exact: true }).click();
  await page.evaluate(() => scrollTo(0, 700));
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("onlydevops.learning-view.v1")).views
            .docker.scroll,
      ),
    )
    .toBe(700);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Docker.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "docker compose up", exact: true }),
  ).toBeAttached();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(700);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Docker.", exact: true }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(700);
  await page.getByRole("button", { name: "05 Kubernetes" }).click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Docker.", exact: true }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(700);
});

test("explicit links override remembered topic and bad storage does not break the sheet", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("onlydevops.learning-view.v1", "invalid json"),
  );
  await page.goto("/#terraform");
  await expect(
    page.getByRole("heading", { name: "Terraform.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue learning" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Blocks & arguments", exact: true }),
  ).toBeFocused();
});

test("continue advances to another topic and handles a completed roadmap", async ({
  page,
}) => {
  await page.route("**/api/sheet", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.completed = data.topics[0].sections.flatMap((s) =>
      s.commands.flatMap((c) => c.items.map((i) => i.id)),
    );
    await route.fulfill({ json: data });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Continue learning" }).click();
  await expect(
    page.getByRole("heading", { name: "Shell scripting.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Shebang", exact: true }),
  ).toBeFocused();
  await page.unroute("**/api/sheet");
  await page.route("**/api/sheet", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.completed = data.topics.flatMap((t) =>
      t.sections.flatMap((s) =>
        s.commands.flatMap((c) => c.items.map((i) => i.id)),
      ),
    );
    await route.fulfill({ json: data });
  });
  await page.reload();
  await expect(
    page.getByText("You’ve completed the roadmap.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue learning" }),
  ).toHaveCount(0);
});
