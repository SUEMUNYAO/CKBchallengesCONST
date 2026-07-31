#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const rpcUrl = process.env.CKB_RPC_URL || "http://127.0.0.1:28114";
const deploymentTx =
  "0xe54a18c3a5bfc8a120e8295035afbb71b64b424e4082dcb4b7419af397ab6be0";
const depositTx =
  "0x4f6e538670b2b3620bc69b14b5a71b3c1709a9dc5ac59b80df8ad70b899a582f";
const unlockTx =
  "0x784f8f1651aac620924db86794882464dcfc8178a1975cd90e5ca68ede062705";

let requestId = 0;
async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: ++requestId,
      jsonrpc: "2.0",
      method,
      params,
    }),
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(`${method} failed: ${JSON.stringify(body.error || body)}`);
  }
  return body.result;
}

function outPoint(txHash, index) {
  return { tx_hash: txHash, index };
}

const [
  tipHeader,
  deploymentTransaction,
  depositTransaction,
  unlockTransaction,
  deploymentCell,
  spentDepositCell,
  recipientCell,
  changeCell,
] = await Promise.all([
  rpc("get_tip_header"),
  rpc("get_transaction", [deploymentTx]),
  rpc("get_transaction", [depositTx]),
  rpc("get_transaction", [unlockTx]),
  rpc("get_live_cell", [outPoint(deploymentTx, "0x0"), true]),
  rpc("get_live_cell", [outPoint(depositTx, "0x0"), true]),
  rpc("get_live_cell", [outPoint(unlockTx, "0x0"), true]),
  rpc("get_live_cell", [outPoint(unlockTx, "0x1"), true]),
]);

const evidence = {
  schema: "ckb-campaign-03-intent-lock-proof-v1",
  network: "OffCKB local devnet",
  rpcUrl,
  capturedAt: new Date().toISOString(),
  hashes: { deploymentTx, depositTx, unlockTx },
  tipHeader,
  deploymentTransaction,
  depositTransaction,
  unlockTransaction,
  liveCells: {
    deploymentCell,
    spentDepositCell,
    recipientCell,
    changeCell,
  },
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(scriptDirectory, "../../proof/rpc-evidence.json");
fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);

console.log("RPC PROOF captured");
console.log(`TIP ${tipHeader.number}`);
console.log(`DEPLOYMENT ${deploymentTx}`);
console.log(`DEPOSIT ${depositTx}`);
console.log(`UNLOCK ${unlockTx}`);
console.log(`OUTPUT ${output}`);
