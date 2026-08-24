/**
 * Decode the testnet DOB image and verify round-trip integrity
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { hexStringToUint8Array } from "./helper.ts";
import { ccc } from "@ckb-ccc/core";
import { setSporeConfig, unpackToRawSporeData } from "@spore-sdk/core";
import { SPORE_CONFIG } from "./spore-config.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

setSporeConfig(SPORE_CONFIG);

const TESTNET_TX = process.argv[2] || "";

async function main() {
  if (!TESTNET_TX) {
    console.error("Usage: tsx decode-testnet.ts <transaction-hash>");
    process.exit(1);
  }

  console.log("Fetching DOB from testnet...");
  const client = new ccc.ClientPublicTestnet({ url: "https://testnet.ckbapp.dev/" });

  const cell = await client.getCellLive({ txHash: TESTNET_TX, index: "0x0" }, true);
  if (!cell) {
    console.error("Cell not found on testnet");
    process.exit(1);
  }

  const sporeData = unpackToRawSporeData(cell.outputData);
  console.log("Content type:", sporeData.contentType);

  const rawContent = sporeData.content.toString();
  const hexContent = rawContent.startsWith("0x") ? rawContent.slice(2) : rawContent;
  const decodedBytes = hexStringToUint8Array(hexContent);

  const outputPath = resolve(__dirname, "decoded-dob-testnet.jpg");
  writeFileSync(outputPath, Buffer.from(decodedBytes));
  console.log("Decoded image saved to:", outputPath);
  console.log("Decoded size:", decodedBytes.length, "bytes");

  // Verify against original
  const original = readFileSync(resolve(__dirname, "sample-dob-image.jpg"));
  const match = original.length === decodedBytes.length &&
    original.every((v, i) => v === decodedBytes[i]);

  console.log("\n=== Round-trip Integrity ===");
  console.log("Original size:", original.length, "bytes");
  console.log("Decoded size:", decodedBytes.length, "bytes");
  console.log("Integrity:", match ? "✅ PASS" : "❌ FAIL");

  console.log("\n=== Testnet Proof ===");
  console.log("Transaction:", TESTNET_TX);
  console.log("Explorer:", `https://testnet.explorer.nervos.org/transaction/${TESTNET_TX}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
