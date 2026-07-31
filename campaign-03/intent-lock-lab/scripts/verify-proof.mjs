#!/usr/bin/env node

import { ccc, hashTypeToBytes, hexFrom } from "@ckb-ccc/core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const proofDirectory = path.resolve(root, "../proof");
const evidence = JSON.parse(
  fs.readFileSync(path.join(proofDirectory, "rpc-evidence.json"), "utf8"),
);
const deployments = JSON.parse(
  fs.readFileSync(path.join(root, "deployment/scripts.json"), "utf8"),
);
const systemScripts = JSON.parse(
  fs.readFileSync(path.join(root, "deployment/system-scripts.json"), "utf8"),
);
const bytecode = fs.readFileSync(path.join(root, "dist/intent-lock.bc"));

const DEPLOYMENT_TX =
  "0xe54a18c3a5bfc8a120e8295035afbb71b64b424e4082dcb4b7419af397ab6be0";
const DEPOSIT_TX =
  "0x4f6e538670b2b3620bc69b14b5a71b3c1709a9dc5ac59b80df8ad70b899a582f";
const UNLOCK_TX =
  "0x784f8f1651aac620924db86794882464dcfc8178a1975cd90e5ca68ede062705";
const PREIMAGE = "paper cranes cross midnight";
const CODE_HASH =
  "0xf223d4ed8d528e7bdc42f39fc80d39f0db02199684d8dd30cc04b123e73b2f36";
const PREIMAGE_HASH =
  "0x545b1590537706decc12d20cff64a290aca43e04740fe512ad9b734be11b1a2b";
const RECIPIENT_LOCK_HASH =
  "0x7de82d61a7eb2ec82b0dc653e558ba120efcbfbb44dac87c12972d05bf250653";

const checks = [];
function check(name, condition) {
  if (!condition) throw new Error(`FAIL ${name}`);
  checks.push(name);
  console.log(`PASS ${name}`);
}

function textToHex(value) {
  return hexFrom(new TextEncoder().encode(value));
}

function scriptFromRpc(script) {
  return ccc.Script.from({
    codeHash: script.code_hash,
    hashType: script.hash_type,
    args: script.args,
  });
}

function capacity(output) {
  return BigInt(output.capacity);
}

const deployment = evidence.deploymentTransaction;
const deposit = evidence.depositTransaction;
const unlock = evidence.unlockTransaction;
const deploymentInfo = deployments.devnet["intent-lock.bc"];
const deploymentOutput = deployment.transaction.outputs[0];
const depositOutput = deposit.transaction.outputs[0];
const recipientOutput = unlock.transaction.outputs[0];
const changeOutput = unlock.transaction.outputs[1];
const expectedWitness = hexFrom(
  new ccc.WitnessArgs(textToHex(PREIMAGE)).toBytes(),
);
const bytecodeHex = hexFrom(bytecode);
const computedCodeHash = ccc.hashCkb(bytecodeHex);
const computedPreimageHash = ccc.hashCkb(textToHex(PREIMAGE));
const computedRecipientLockHash = ccc.hashCkb(
  scriptFromRpc(recipientOutput.lock).toBytes(),
);
const expectedArgs =
  "0x0000" +
  CODE_HASH.slice(2) +
  hexFrom(hashTypeToBytes(deploymentInfo.hashType)).slice(2) +
  PREIMAGE_HASH.slice(2) +
  RECIPIENT_LOCK_HASH.slice(2);

check("proof schema", evidence.schema === "ckb-campaign-03-intent-lock-proof-v1");
check("network scope", evidence.network === "OffCKB local devnet");
check("deployment hash ledger", evidence.hashes.deploymentTx === DEPLOYMENT_TX);
check("deposit hash ledger", evidence.hashes.depositTx === DEPOSIT_TX);
check("unlock hash ledger", evidence.hashes.unlockTx === UNLOCK_TX);
check("deployment transaction hash", deployment.transaction.hash === DEPLOYMENT_TX);
check("deposit transaction hash", deposit.transaction.hash === DEPOSIT_TX);
check("unlock transaction hash", unlock.transaction.hash === UNLOCK_TX);
check("deployment committed", deployment.tx_status.status === "committed");
check("deposit committed", deposit.tx_status.status === "committed");
check("unlock committed", unlock.tx_status.status === "committed");
check("deployment metadata hash", deploymentInfo.codeHash === CODE_HASH);
check("deployment metadata transaction", deploymentInfo.cellDeps[0].cellDep.outPoint.txHash === DEPLOYMENT_TX);
check("compiled bytecode CKB hash", computedCodeHash === CODE_HASH);
check("deployment bytecode content", evidence.liveCells.deploymentCell.cell.data.content === bytecodeHex);
check("deployment live-cell data hash", evidence.liveCells.deploymentCell.cell.data.hash === CODE_HASH);
check("deployment cell is live", evidence.liveCells.deploymentCell.status === "live");
check("preimage CKB hash", computedPreimageHash === PREIMAGE_HASH);
check("recipient script hash", computedRecipientLockHash === RECIPIENT_LOCK_HASH);
check("intent argument bytes", depositOutput.lock.args === expectedArgs);
check("intent argument length", (depositOutput.lock.args.length - 2) / 2 === 99);
check("intent lock code hash", depositOutput.lock.code_hash === systemScripts.devnet.ckb_js_vm.script.codeHash);
check("intent lock hash type", depositOutput.lock.hash_type === "type");
check("deposit output count", deposit.transaction.outputs.length === 2);
check("deposit output data", deposit.transaction.outputs_data[0] === "0x");
check("deposit capacity", capacity(depositOutput) === ccc.fixedPointFrom("360"));
check("unlock input count", unlock.transaction.inputs.length === 1);
check("unlock spends deposit", unlock.transaction.inputs[0].previous_output.tx_hash === DEPOSIT_TX);
check("unlock spends deposit index zero", unlock.transaction.inputs[0].previous_output.index === "0x0");
check("unlock contract dependency", unlock.transaction.cell_deps.some((dep) => dep.out_point.tx_hash === DEPLOYMENT_TX));
check("unlock output count", unlock.transaction.outputs.length === 2);
check("recipient capacity", capacity(recipientOutput) === ccc.fixedPointFrom("120"));
check("change capacity", capacity(changeOutput) === ccc.fixedPointFrom("239.99999"));
check("change preserves intent lock", JSON.stringify(changeOutput.lock) === JSON.stringify(depositOutput.lock));
check("recipient data empty", unlock.transaction.outputs_data[0] === "0x");
check("change data empty", unlock.transaction.outputs_data[1] === "0x");
check("canonical preimage witness", unlock.transaction.witnesses[0] === expectedWitness);
check("transaction fee", capacity(depositOutput) - capacity(recipientOutput) - capacity(changeOutput) === 1000n);
check("spent deposit is unknown", evidence.liveCells.spentDepositCell.status === "unknown");
check("spent deposit has no cell", evidence.liveCells.spentDepositCell.cell === null);
check("recipient cell is live", evidence.liveCells.recipientCell.status === "live");
check("recipient live capacity", capacity(evidence.liveCells.recipientCell.cell.output) === ccc.fixedPointFrom("120"));
check("recipient live lock", JSON.stringify(evidence.liveCells.recipientCell.cell.output.lock) === JSON.stringify(recipientOutput.lock));
check("change cell is live", evidence.liveCells.changeCell.status === "live");
check("change live capacity", capacity(evidence.liveCells.changeCell.cell.output) === ccc.fixedPointFrom("239.99999"));
check("change live lock", JSON.stringify(evidence.liveCells.changeCell.cell.output.lock) === JSON.stringify(changeOutput.lock));
check("raw proof excludes private key", !JSON.stringify(evidence).includes("PRIVATE_KEY"));

console.log(`VERIFICATION passed: ${checks.length} checks`);
