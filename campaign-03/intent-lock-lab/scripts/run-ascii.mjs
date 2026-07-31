#!/usr/bin/env node

import { spawnSync } from "child_process";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/run-ascii.mjs <command> [...args]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  encoding: "utf8",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  maxBuffer: 20 * 1024 * 1024,
  shell: false,
});

const clean = (value) =>
  (value || "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/[ \t]+$/gm, "")
    .trim();

const stdout = clean(result.stdout);
const stderr = clean(result.stderr);
if (stdout) console.log(stdout);
if (stderr) console.error(stderr);

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
