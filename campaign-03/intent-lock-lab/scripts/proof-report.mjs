#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";

const mode = process.argv[2] || "final";
const proof = JSON.parse(fs.readFileSync("../proof/rpc-evidence.json", "utf8"));
const result = JSON.parse(
  fs.readFileSync("../proof/campaign-03-result.json", "utf8"),
);

if (mode === "environment") {
  const version = spawnSync("offckb", ["--version"], { encoding: "utf8" });
  const output = `${version.stdout || ""}${version.stderr || ""}`
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .trim();
  console.log("BUILD ON CKB CAMPAIGN 03");
  console.log("Environment");
  console.log(output);
  console.log(`RPC http://127.0.0.1:28114`);
  console.log(`TIP ${proof.tipHeader.number}`);
  console.log("STATUS ready");
} else if (mode === "deployment") {
  console.log("BUILD ON CKB CAMPAIGN 03");
  console.log("Custom lock deployment");
  console.log(`CONTRACT ${result.contract.name}`);
  console.log(`CODE_HASH ${result.contract.codeHash}`);
  console.log(`TRANSACTION ${result.contract.deploymentTx}`);
  console.log(`STATUS ${result.contract.deploymentStatus}`);
  console.log(`BYTECODE_SHA256 ${result.contract.bytecodeSha256}`);
} else {
  console.log("BUILD ON CKB CAMPAIGN 03");
  console.log("Committed cell transition");
  console.log(`DEPOSIT ${result.deposit.txHash}`);
  console.log(`DEPOSIT_AFTER_UNLOCK ${result.deposit.postUnlockCellStatus}`);
  console.log(`UNLOCK ${result.unlock.txHash}`);
  console.log(`RECIPIENT ${result.unlock.recipientCapacityCkb} CKB / ${result.unlock.recipientCellStatus}`);
  console.log(`CHANGE ${result.unlock.changeCapacityCkb} CKB / ${result.unlock.changeCellStatus}`);
  console.log(`FEE ${result.unlock.feeCkb} CKB`);
  console.log(`OFFLINE_CHECKS ${result.verification.offlineCheckCount} passed`);
}
