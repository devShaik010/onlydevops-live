import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

async function createAccount(page, username, password) {
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".topbar")).toHaveCount(0);
  await expect(page.locator(".auth-avatar img")).toHaveAttribute(
    "src",
    /\/adventurer\/svg\?seed=/,
  );
  await page.getByLabel("Username", { exact: true }).fill(username);
  const passwordInput = page.getByLabel("Password", { exact: true });
  await passwordInput.fill(password);
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await page.getByLabel(/I agree to the Privacy Policy/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("button", { name: "Open profile menu" }),
  ).toBeVisible();
}

async function signIn(page, username, password) {
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function logOut(page) {
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
}

test("account gate, two-device sync, profile, logout, and sign in", async ({
  browser,
}) => {
  const username = `test_${Date.now()}`;
  const password = "passw0rd";
  const deviceA = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const deviceB = await browser.newContext();
  const a = await deviceA.newPage();
  const b = await deviceB.newPage();
  const base = process.env.BASE_URL || "http://localhost:8080";
  try {
    await a.goto(base);
    await createAccount(a, username, password);
    const check = a.getByRole("checkbox", { name: "ls -a", exact: true });
    await check.click();
    await expect(check).toBeChecked();

    await b.goto(base);
    await signIn(b, username, password);
    const remoteCheck = b.getByRole("checkbox", { name: "ls -a", exact: true });
    await expect(remoteCheck).toBeChecked();
    await remoteCheck.click();
    await a.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(check).not.toBeChecked();

    await a.getByRole("button", { name: "Open profile menu" }).click();
    await a.getByRole("menuitem", { name: "Profile" }).click();
    await a.getByLabel("Display name").fill("Dev Learner");
    await a.getByLabel("Email").fill("dev.learner@example.com");
    await a.getByRole("button", { name: "Save changes" }).click();
    await expect(
      a.getByRole("button", { name: "Open profile menu" }),
    ).toContainText("Dev Learner");

    await logOut(a);
    await expect(a.getByRole("dialog")).toBeVisible();
    await expect(a.locator(".topbar")).toHaveCount(0);
    await expect(
      b.getByRole("button", { name: "Open profile menu" }),
    ).toBeVisible();

    await a.getByRole("button", { name: "Sign in", exact: true }).click();
    await a.getByLabel("Username", { exact: true }).fill(username);
    await a.getByLabel("Password", { exact: true }).fill("incorrect");
    await a.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(a.getByRole("alert")).toContainText("incorrect");
    await a.getByLabel("Password", { exact: true }).fill(password);
    await a.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      a.getByRole("button", { name: "Open profile menu" }),
    ).toBeVisible();
  } finally {
    await deviceA.close();
    await deviceB.close();
    execFileSync("docker", [
      "compose",
      "exec",
      "-T",
      "api",
      "python",
      "-c",
      `import os,sys,psycopg
with psycopg.connect(os.environ['DATABASE_URL']) as db:
 db.execute('DELETE FROM progress WHERE learner IN (SELECT id FROM accounts WHERE username = %s)', (sys.argv[1],))
 db.execute('DELETE FROM accounts WHERE username = %s', (sys.argv[1],))
 db.execute('DELETE FROM auth_limits WHERE bucket = %s', ('user:'+sys.argv[1],))`,
      username,
    ]);
  }
});
