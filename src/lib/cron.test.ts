import assert from "node:assert/strict";
import { cronAuthorized } from "./cron";

function req(headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/cron/heartbeat", { headers });
}

// process.env.NODE_ENV is typed readonly in recent @types/node — go through a record.
const env = process.env as unknown as Record<string, string | undefined>;

async function main() {
  const prevSecret = env.CRON_SECRET;
  const prevNodeEnv = env.NODE_ENV;

  env.CRON_SECRET = "test-secret";
  assert.equal(cronAuthorized(req({ authorization: "Bearer test-secret" })), true);
  assert.equal(cronAuthorized(req({ authorization: "Bearer wrong" })), false);
  assert.equal(cronAuthorized(req()), false);

  delete env.CRON_SECRET;
  env.NODE_ENV = "development";
  assert.equal(cronAuthorized(req()), true);
  env.NODE_ENV = "production";
  assert.equal(cronAuthorized(req()), false);

  if (prevSecret === undefined) delete env.CRON_SECRET;
  else env.CRON_SECRET = prevSecret;
  if (prevNodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = prevNodeEnv;

  console.log("cron auth tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
