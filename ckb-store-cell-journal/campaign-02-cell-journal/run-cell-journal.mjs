import { ccc, KnownScript } from "@ckb-ccc/core";
import dotenv from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");
const proofDir = process.env.PROOF_DIR || join(packageRoot, "..", "campaign-02-proof");
mkdirSync(proofDir, { recursive: true });

const systemScripts = JSON.parse(readFileSync(join(packageRoot, "deployment", "system-scripts.json"), "utf8"));
const config = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf8"));
const RPC_URL = process.env.CKB_RPC_URL || "http://127.0.0.1:28114";
const MESSAGE = process.env.CELL_JOURNAL_MESSAGE || config.message;
const ACCOUNT = process.env.CELL_JOURNAL_ACCOUNT || config.account;

function toHex(text) {
  return "0x" + Array.from(new TextEncoder().encode(text), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = clean.match(/[0-9a-fA-F]{2}/g)?.map((byte) => parseInt(byte, 16)) || [];
  return new TextDecoder().decode(new Uint8Array(bytes));
}

async function rpc(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  const body = await response.json();
  if (body.error) {
    throw new Error(`${method} RPC error: ${JSON.stringify(body.error)}`);
  }
  return body.result;
}

function devnetScripts() {
  return {
    [KnownScript.Secp256k1Blake160]: systemScripts.devnet.secp256k1_blake160_sighash_all.script,
    [KnownScript.Secp256k1Multisig]: systemScripts.devnet.secp256k1_blake160_multisig_all.script,
    [KnownScript.NervosDao]: systemScripts.devnet.dao.script,
    [KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay.script,
    [KnownScript.OmniLock]: systemScripts.devnet.omnilock.script,
    [KnownScript.XUdt]: systemScripts.devnet.xudt.script,
  };
}

async function waitForFinality(txHash) {
  for (let round = 1; round <= 40; round++) {
    const tx = await rpc("get_transaction", [txHash]);
    const status = tx?.tx_status?.status || "unknown";
    console.log(`  journal lookup ${round}: ${status}`);
    if (status === "committed") {
      return tx;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`Transaction ${txHash} was not committed in time`);
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in ignored .env file");
  }

  console.log("CKB Campaign 2 Cell Journal Run");
  console.log(`Repository identity: CKBchallengesCONST / ${ACCOUNT}`);
  console.log(`Tutorial: ${config.tutorialUrl}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Tip at start: ${await rpc("get_tip_block_number")}`);

  console.log("\nJournal step A - Seal a readable sentence into bytes");
  console.log(`Journal entry: ${MESSAGE}`);
  const cellDataHex = toHex(MESSAGE);
  console.log(`Cell data hex: ${cellDataHex}`);
  console.log(`Immediate decode check: ${fromHex(cellDataHex)}`);

  console.log("\nJournal step B - Assemble one output cell carrying the entry");
  const client = new ccc.ClientPublicTestnet({
    url: RPC_URL,
    scripts: devnetScripts(),
    fallbacks: ["http://127.0.0.1:8114"],
  });
  const signer = new ccc.SignerCkbPrivateKey(client, process.env.PRIVATE_KEY);
  const lock = (await signer.getRecommendedAddressObj()).script;
  const tx = ccc.Transaction.from({
    outputs: [{ lock }],
    outputsData: [cellDataHex],
  });

  console.log(`Journal cell lock args: ${lock.args}`);
  console.log(`Draft output count: ${tx.outputs.length}`);
  console.log(`Draft data payload: ${tx.outputsData[0]}`);

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  console.log(`Funded input count: ${tx.inputs.length}`);
  console.log(`Final output count: ${tx.outputs.length}`);
  console.log(`Journal output capacity: ${tx.outputs[0].capacity?.toString()}`);

  const txHash = await signer.sendTransaction(tx);
  console.log(`Journal transaction sent: ${txHash}`);

  console.log("\nJournal step C - Reopen the live cell by out point");
  const committed = await waitForFinality(txHash);
  const outPoint = { tx_hash: txHash, index: "0x0" };
  const liveCell = await rpc("get_live_cell", [outPoint, true]);
  const storedHex = liveCell.cell.data.content;
  const reopened = fromHex(storedHex);

  console.log(`Committed at block: ${committed.tx_status.block_number}`);
  console.log(`Journal out point: ${txHash}:0x0`);
  console.log(`Live cell status: ${liveCell.status}`);
  console.log(`Live cell capacity: ${liveCell.cell.output.capacity}`);
  console.log(`Reopened hex: ${storedHex}`);
  console.log(`Reopened text: ${reopened}`);

  if (liveCell.status !== "live" || reopened !== MESSAGE) {
    throw new Error("The reopened live cell did not match the journal entry");
  }

  const proof = {
    repo: "CKBchallengesCONST",
    account: ACCOUNT,
    tutorial: "Store Data on Cell",
    tutorialUrl: config.tutorialUrl,
    network: "OffCKB local devnet",
    rpcUrl: RPC_URL,
    message: MESSAGE,
    encodedHex: cellDataHex,
    txHash,
    outPoint: { txHash, index: "0x0" },
    txStatus: committed.tx_status.status,
    blockNumber: committed.tx_status.block_number,
    liveCellStatus: liveCell.status,
    liveCellCapacity: liveCell.cell.output.capacity,
    liveCellDataHex: storedHex,
    liveCellDecoded: reopened,
  };
  const proofPath = join(proofDir, "cell-journal-result.json");
  writeFileSync(proofPath, JSON.stringify(proof, null, 2) + "\n");
  console.log(`\nSaved cell journal proof: ${proofPath}`);
  console.log("Cell journal proof complete: encoded, built, committed, reopened, decoded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
