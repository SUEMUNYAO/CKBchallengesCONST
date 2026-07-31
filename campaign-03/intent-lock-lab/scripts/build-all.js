#!/usr/bin/env node

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const contractsDirectory = path.join(process.cwd(), "contracts");
const isDebug = process.argv.includes("--debug");

if (!fs.existsSync(contractsDirectory)) {
  console.error("No contracts directory found");
  process.exit(1);
}

const contracts = fs
  .readdirSync(contractsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (contracts.length === 0) {
  console.error("No contracts found");
  process.exit(1);
}

console.log(`BUILD contracts: ${contracts.join(", ")}`);
for (const contract of contracts) {
  try {
    execFileSync(
      process.execPath,
      [
        path.join("scripts", "build-contract.js"),
        contract,
        ...(isDebug ? ["--debug"] : []),
      ],
      { stdio: "inherit" },
    );
  } catch (error) {
    console.error(`BUILD failed: ${contract}`);
    process.exit(error.status || 1);
  }
}
console.log("BUILD all contracts: passed");
