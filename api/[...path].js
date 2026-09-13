const crypto = require("node:crypto");
const syllabus = require("./syllabus.json");
const challenges = require("./challenges.json");

const projectUrl = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
const itemIds = new Set(syllabus.flatMap((topic) => topic.sections.flatMap((section) => section.commands.flatMap((command) => command.items.map((item) => item.id)))));
const adminSecret = () => process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function supabase(path, options = {}) {
  if (!projectUrl() || !serviceKey()) throw new Error("Supabase server environment is not configured.");
  const response = await fetch(`${projectUrl()}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((entry) => {
    const [key, ...value] = entry.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function cookieHeader(name, value, maxAge) {
  const secure = process.env.COOKIE_SECURE === "false" ? "" : "; Secure";
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
}

function adminCookie(token, maxAge) {
  const secure = process.env.COOKIE_SECURE === "false" ? "" : "; Secure";
  return `onlydevops_admin=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure}`;
}

function adminToken() {
  return crypto.createHmac("sha256", adminSecret()).update("onlydevops-admin").digest("hex");
}

function isAdmin(req) {
  if (!adminSecret()) return false;
  const token = cookies(req).onlydevops_admin || "";
  return token.length === 64 && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(adminToken()));
}

function send(res, status, body, extra = {}) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [key, value] of Object.entries(extra)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

function jsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; if (raw.length > 100_000) reject(new Error("Request body is too large.")); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("JSON requests are required.")); } });
    req.on("error", reject);
  });
}

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const digest = crypto.scryptSync(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return `${salt.toString("hex")}:${digest.toString("hex")}`;
}

function validPassword(password, encoded) {
  const [salt, expected] = encoded.split(":");
  const actual = hashPassword(password, Buffer.from(salt, "hex")).split(":")[1];
  return expected && crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function tokenHash(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
function newId() { return crypto.randomUUID(); }

async function currentLearner(req) {
  const jar = cookies(req);
  if (jar.onlydevops_session) {
    const sessions = await supabase(`sessions?token_hash=eq.${encodeURIComponent(tokenHash(jar.onlydevops_session))}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=account_id,accounts(*)`, { method: "GET" });
    if (sessions?.[0]) {
      const account = sessions[0].accounts;
      return {
        id: sessions[0].account_id,
        username: account.username,
        display_name: account.display_name || null,
        email: account.email || null,
        account: true,
      };
    }
  }
  return { id: jar.onlydevops_learner || newId(), username: null, account: false };
}

function publicUser(account) {
  return account?.username
    ? { username: account.username, display_name: account.display_name || null, email: account.email || null }
    : null;
}

async function sheet(req, res) {
  const learner = await currentLearner(req);
  const rows = await supabase(`progress?learner=eq.${encodeURIComponent(learner.id)}&select=item_id`, { method: "GET" });
  const headers = learner.account ? {} : { "Set-Cookie": cookieHeader("onlydevops_learner", learner.id, 60 * 60 * 24 * 365) };
  send(res, 200, { topics: syllabus, completed: rows.map((row) => row.item_id).filter((id) => itemIds.has(id)), learner: learner.id, user: publicUser(learner) }, headers);
}

function publicChallenge(challenge, result) {
  const response = { ...challenge, answer: undefined, explanation: undefined, verification: undefined, sources: undefined, options: challenge.options.map(({ id, label }) => ({ id, label })), result: null };
  delete response.answer; delete response.explanation; delete response.verification; delete response.sources;
  if (result) {
    const option = challenge.options.find((entry) => entry.id === result.choice_id);
    response.result = { choice_id: result.choice_id, correct: result.correct, answer: challenge.answer, feedback: option.feedback, explanation: challenge.explanation, verification: challenge.verification, sources: challenge.sources };
  }
  return response;
}

async function practice(req, res) {
  const learner = await currentLearner(req);
  const rows = await supabase(`practice_progress?learner=eq.${encodeURIComponent(learner.id)}&select=challenge_id,version,choice_id,correct`, { method: "GET" });
  const results = new Map(rows.map((row) => [row.challenge_id, row]));
  const headers = learner.account ? {} : { "Set-Cookie": cookieHeader("onlydevops_learner", learner.id, 60 * 60 * 24 * 365) };
  send(res, 200, { challenges: challenges.map((challenge) => publicChallenge(challenge, results.get(challenge.id))), learner: learner.id, user: publicUser(learner) }, headers);
}

async function authenticate(req, res, mode) {
  const body = await jsonBody(req);
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!/^[a-z0-9_]{3,32}$/.test(username) || password.length < 12 || password.length > 128) return send(res, 422, { detail: "Check your username and password requirements." });
  const matches = await supabase(`accounts?username=eq.${encodeURIComponent(username)}&select=id,username,password_hash`, { method: "GET" });
  let user = matches?.[0];
  if (mode === "register") {
    if (user) return send(res, 409, { detail: "That username is taken. Choose another or sign in." });
    const created = await supabase("accounts", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ id: newId(), username, password_hash: hashPassword(password) }) });
    user = created[0];
  } else if (!user || !validPassword(password, user.password_hash)) {
    return send(res, 401, { detail: "Username or password is incorrect." });
  }
  const jar = cookies(req);
  const anonymous = jar.onlydevops_learner;
  if (anonymous) {
    const [progress, practiceRows] = await Promise.all([
      supabase(`progress?learner=eq.${encodeURIComponent(anonymous)}&select=item_id,completed_at`, { method: "GET" }),
      supabase(`practice_progress?learner=eq.${encodeURIComponent(anonymous)}&select=challenge_id,version,choice_id,correct,updated_at`, { method: "GET" }),
    ]);
    if (progress?.length) await supabase("progress", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify(progress.map((row) => ({ ...row, learner: user.id }))) });
    if (practiceRows?.length) await supabase("practice_progress", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify(practiceRows.map((row) => ({ ...row, learner: user.id }))) });
  }
  const token = crypto.randomBytes(32).toString("base64url");
  await supabase("sessions", { method: "POST", body: JSON.stringify({ token_hash: tokenHash(token), account_id: user.id, expires_at: new Date(Date.now() + 30 * 864e5).toISOString() }) });
  send(res, mode === "register" ? 201 : 200, { user: publicUser(user) }, { "Set-Cookie": [cookieHeader("onlydevops_session", token, 30 * 86400), clearCookie("onlydevops_learner")] });
}

async function updateProfile(req, res) {
  const learner = await currentLearner(req);
  if (!learner.account) return send(res, 401, { detail: "Sign in to update your profile." });
  const body = await jsonBody(req);
  const displayName = String(body.display_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  if (displayName && (displayName.length < 2 || displayName.length > 50)) {
    return send(res, 422, { detail: "Display name must be between 2 and 50 characters." });
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return send(res, 422, { detail: "Enter a valid email address." });
  }
  const updated = await supabase(`accounts?id=eq.${encodeURIComponent(learner.id)}&select=username,display_name,email`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ display_name: displayName || null, email: email || null }),
  });
  if (!updated?.[0]) return send(res, 404, { detail: "Profile not found." });
  return send(res, 200, { user: publicUser(updated[0]) });
}

async function adminLogin(req, res) {
  const body = await jsonBody(req);
  const valid = adminSecret() && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_AUTHCODE
    && String(body.username || "") === String(process.env.ADMIN_USERNAME)
    && String(body.password || "") === String(process.env.ADMIN_PASSWORD || "")
    && String(body.authcode || "") === String(process.env.ADMIN_AUTHCODE || "");
  if (!valid) return send(res, 401, { detail: "Admin credentials are incorrect." });
  return send(res, 200, { ok: true }, { "Set-Cookie": adminCookie(adminToken(), 60 * 60 * 8) });
}

async function adminStats(req, res) {
  if (!isAdmin(req)) return send(res, 401, { detail: "Admin sign-in required." });
  const now = new Date();
  const [accounts, sessions, progress, practice] = await Promise.all([
    supabase("accounts?select=created_at&order=created_at.asc", { method: "GET" }),
    supabase(`sessions?expires_at=gt.${encodeURIComponent(now.toISOString())}&select=account_id`, { method: "GET" }),
    supabase("progress?select=learner", { method: "GET" }),
    supabase("practice_progress?select=learner,correct", { method: "GET" }),
  ]);
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: accounts.filter((account) => String(account.created_at).slice(0, 10) === key).length };
  });
  return send(res, 200, {
    registered: accounts.length,
    activeSessions: new Set(sessions.map((session) => session.account_id)).size,
    checklistCompletions: progress.length,
    practiceAttempts: practice.length,
    correctAttempts: practice.filter((attempt) => attempt.correct).length,
    registrations: days,
    updatedAt: now.toISOString(),
  });
}

async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://vercel.local");
    const path = url.pathname.replace(/^\/api\/?/, "");
    if (req.method === "GET" && path === "health") return send(res, 200, { status: "ok" });
    if (req.method === "GET" && path === "sheet") return sheet(req, res);
    if (req.method === "GET" && path === "practice") return practice(req, res);
    if (req.method === "PATCH" && path === "profile") return updateProfile(req, res);
    if (req.method === "POST" && path === "admin/login") return adminLogin(req, res);
    if (req.method === "POST" && path === "admin/logout") return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie("onlydevops_admin") });
    if (req.method === "GET" && path === "admin/stats") return adminStats(req, res);
    if (req.method === "POST" && path === "auth/register") return authenticate(req, res, "register");
    if (req.method === "POST" && path === "auth/login") return authenticate(req, res, "login");
    if (req.method === "POST" && path === "auth/logout") {
      const jar = cookies(req);
      if (jar.onlydevops_session) await supabase(`sessions?token_hash=eq.${encodeURIComponent(tokenHash(jar.onlydevops_session))}`, { method: "DELETE" });
      return send(res, 200, { ok: true }, { "Set-Cookie": [clearCookie("onlydevops_session"), cookieHeader("onlydevops_learner", newId(), 60 * 60 * 24 * 365)] });
    }
    const progressMatch = path.match(/^progress\/([^/]+)$/);
    if (req.method === "PUT" && progressMatch) {
      const body = await jsonBody(req);
      if (!itemIds.has(progressMatch[1]) || typeof body.completed !== "boolean") return send(res, 422, { detail: "Invalid checklist item or completion value." });
      const learner = await currentLearner(req);
      if (!learner.id) return send(res, 401, { detail: "Open your sheet before updating progress." });
      if (body.completed) await supabase("progress", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ learner: learner.id, item_id: progressMatch[1] }) });
      else await supabase(`progress?learner=eq.${encodeURIComponent(learner.id)}&item_id=eq.${encodeURIComponent(progressMatch[1])}`, { method: "DELETE" });
      return send(res, 200, { item_id: progressMatch[1], completed: body.completed });
    }
    const answerMatch = path.match(/^practice\/([^/]+)\/answer$/);
    if (req.method === "POST" && answerMatch) {
      const challenge = challengeById.get(answerMatch[1]);
      const body = await jsonBody(req);
      if (!challenge) return send(res, 404, { detail: "Practice challenge not found." });
      if (body.version !== challenge.version) return send(res, 409, { detail: "This challenge was updated. Reload to try the latest version." });
      const option = challenge.options.find((entry) => entry.id === body.choice_id);
      if (!option) return send(res, 422, { detail: "Choose one of the available answers." });
      const learner = await currentLearner(req);
      if (!learner.id || req.headers["x-learner"] !== learner.id) return send(res, 409, { detail: "Your account changed. Reload practice before saving." });
      const result = { choice_id: body.choice_id, correct: body.choice_id === challenge.answer, answer: challenge.answer, feedback: option.feedback, explanation: challenge.explanation, verification: challenge.verification, sources: challenge.sources };
      await supabase("practice_progress", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ learner: learner.id, challenge_id: challenge.id, version: challenge.version, choice_id: body.choice_id, correct: result.correct, updated_at: new Date().toISOString() }) });
      return send(res, 200, result);
    }
    return send(res, 404, { detail: "Not found." });
  } catch (error) {
    console.error(error);
    return send(res, 500, { detail: "The service is not configured or is temporarily unavailable." });
  }
}

module.exports = handler;
