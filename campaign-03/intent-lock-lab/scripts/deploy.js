#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";

function parseArgs(argv) {
  const parsed = { network: "devnet", typeId: false, yes: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--network" && argv[index + 1]) {
      parsed.network = argv[index + 1];
      index += 1;
    } else if (argument === "--type-id" || argument === "-t") {
      parsed.typeId = true;
    } else if (argument === "--yes" || argument === "-y") {
      parsed.yes = true;
    }
  }
  return parsed;
}

const target = "dist";
const output = "deployment";
const options = parseArgs(process.argv.slice(2).filter((arg) => arg !== "--"));

if (!fs.existsSync(target)) {
  console.error("DEPLOY failed: dist directory not found");
  process.exit(1);
}

const bytecode = fs.readdirSync(target).filter((file) => file.endsWith(".bc"));
if (bytecode.length === 0) {
  console.error("DEPLOY failed: no bytecode files found");
  process.exit(1);
}

const args = [
  "deploy",
  "--network",
  options.network,
  "--target",
  target,
  "--output",
  output,
  ...(options.typeId ? ["--type-id"] : []),
  ...(options.yes ? ["--yes"] : []),
];

console.log(`DEPLOY contracts: ${bytecode.join(", ")}`);
console.log(`NETWORK ${options.network}`);
console.log(`COMMAND offckb ${args.join(" ")}`);

const result = spawnSync("offckb", args, {
  encoding: "utf8",
  shell: false,
});
const ascii = (value) =>
  (value || "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/^\s+$/gm, "")
    .trim();

const stdout = ascii(result.stdout);
const stderr = ascii(result.stderr);
if (stdout) console.log(stdout);
if (stderr) console.error(stderr);

if (result.error) {
  console.error(`DEPLOY failed: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`DEPLOY failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log("DEPLOY status: passed");
console.log(`ARTIFACTS ${output}`);
