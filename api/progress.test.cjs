const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");

const handler = require("./[...path].js");

const originalFetch = global.fetch;
const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

before(() => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
});

after(() => {
  global.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
});

function callApi(body) {
  const learner = "00000000-0000-4000-8000-000000000001";
  const req = Object.assign(Readable.from([JSON.stringify(body)]), {
    method: "PUT",
    url: "/api/progress",
    headers: {
      cookie: "onlydevops_session=test-session",
      "x-learner": learner,
    },
  });
  return new Promise((resolve) => {
    const headers = {};
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        headers[name] = value;
      },
      end(value) {
        resolve({ status: this.statusCode, headers, body: JSON.parse(value) });
      },
    };
    handler(req, res);
  });
}

test("progress changes use one bulk insert and one bulk delete", async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/sessions?")) {
      return new Response(
        JSON.stringify([
          {
            account_id: "00000000-0000-4000-8000-000000000001",
            accounts: { username: "batch_test" },
          },
        ]),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(null, { status: 204 });
  };

  const response = await callApi({
    changes: [
      { item_id: "linux-0-0-1", completed: true },
      { item_id: "linux-0-0-2", completed: true },
      { item_id: "linux-0-0-3", completed: false },
    ],
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.failed, []);
  assert.deepEqual(response.body.saved, [
    "linux-0-0-1",
    "linux-0-0-2",
    "linux-0-0-3",
  ]);
  const writes = calls.slice(1);
  assert.equal(writes.length, 2);
  assert.equal(writes[0].options.method, "POST");
  assert.deepEqual(JSON.parse(writes[0].options.body), [
    {
      learner: "00000000-0000-4000-8000-000000000001",
      item_id: "linux-0-0-1",
    },
    {
      learner: "00000000-0000-4000-8000-000000000001",
      item_id: "linux-0-0-2",
    },
  ]);
  assert.equal(writes[1].options.method, "DELETE");
  assert.match(writes[1].url, /item_id=in\.\(linux-0-0-3\)/);
});

test("invalid progress batches are rejected before database access", async () => {
  global.fetch = async () => {
    throw new Error("Database should not be called.");
  };
  const response = await callApi({
    changes: [{ item_id: "unknown", completed: true }],
  });
  assert.equal(response.status, 422);
});
