import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

async function logOut(page) {
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
}

test("guest import, two-device sync, sign out, and sign in", async ({
  browser,
}) => {
  const username = `test_${Date.now()}`;
  const password = "a-long-test-password";
  const deviceA = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const deviceB = await browser.newContext();
  const a = await deviceA.newPage(),
    b = await deviceB.newPage();
  const base = process.env.BASE_URL || "http://localhost:8080";
  try {
    await a.goto(base);
    const check = a.getByRole("checkbox", { name: "ls -a", exact: true });
    await check.click();
    await expect(check).toBeChecked();
    await a.getByRole("button", { name: "Save my progress" }).click();
    await expect(a.getByRole("dialog")).toBeVisible();
    await a.getByLabel("Username", { exact: true }).fill(username);
    await a.getByLabel("Password", { exact: true }).fill(password);
    await a.screenshot({ path: "/tmp/onlydevops-account-mobile.png" });
    await a
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(a.getByRole("dialog")).toHaveCount(0);
    await expect(a.getByText("Progress synced to your account")).toBeVisible();
    await expect(check).toBeChecked();
    await b.goto(base);
    await b.getByRole("button", { name: "Save my progress" }).click();
    await b.getByRole("button", { name: "Sign in", exact: true }).click();
    await b.getByLabel("Username", { exact: true }).fill(username);
    await b.getByLabel("Password", { exact: true }).fill(password);
    await b.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(b.getByRole("dialog")).toHaveCount(0);
    const remoteCheck = b.getByRole("checkbox", { name: "ls -a", exact: true });
    await expect(remoteCheck).toBeChecked();
    await remoteCheck.click();
    await expect(remoteCheck).not.toBeChecked();
    await a.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(check).not.toBeChecked();
    const avatar = a.getByRole("button", { name: "Open profile menu" });
    await expect(avatar.locator("img")).toHaveAttribute(
      "src",
      /\/adventurer\/svg\?seed=/,
    );
    await avatar.click();
    await a.getByRole("menuitem", { name: "Profile" }).click();
    await a.getByLabel("Display name").fill("Dev Learner");
    await a.getByLabel("Email").fill("dev.learner@example.com");
    await a.getByRole("button", { name: "Save changes" }).click();
    await expect(a.getByRole("dialog")).toHaveCount(0);
    await expect(
      a.getByRole("button", { name: "Open profile menu" }),
    ).toContainText("Dev Learner");
    await logOut(a);
    await expect(
      a.getByRole("button", { name: "Save my progress" }),
    ).toBeVisible();
    await expect(
      b.getByRole("button", { name: "Open profile menu" }),
    ).toBeVisible();
    await a.getByRole("button", { name: "Save my progress" }).click();
    await a.getByRole("button", { name: "Sign in", exact: true }).click();
    await a.getByLabel("Username", { exact: true }).fill(username);
    await a
      .getByLabel("Password", { exact: true })
      .fill("incorrect-long-password");
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
