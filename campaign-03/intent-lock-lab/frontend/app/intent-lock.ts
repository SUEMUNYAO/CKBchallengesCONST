import { ccc, hashTypeToBytes, hexFrom } from "@ckb-ccc/core";
import scripts from "../../deployment/scripts.json";
import systemScripts from "../../deployment/system-scripts.json";
import { cccClient } from "./ccc-client";

type Deployment = {
  codeHash: string;
  hashType: "data" | "type" | "data1" | "data2";
  cellDeps: Array<{ cellDep: ccc.CellDepLike }>;
};

export type Intent = {
  address: string;
  lock: ccc.Script;
  preimageHash: string;
  recipientLockHash: string;
};

export type Limits = {
  available: bigint;
  recipientMinimum: bigint;
  changeMinimum: bigint;
  maximum: bigint;
  fee: bigint;
};

const deployment = (scripts.devnet as Record<string, Deployment>)[
  "intent-lock.bc"
];
const ckbJsVm = systemScripts.devnet.ckb_js_vm;
const FEE = 1000n;

export function textToHex(value: string): `0x${string}` {
  return `0x${Array.from(new TextEncoder().encode(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}`;
}

export function formatCkb(value: bigint) {
  return ccc.fixedPointToString(value);
}

export function parseCkb(value: string) {
  return ccc.fixedPointFrom(value);
}

export function getDeployment() {
  return deployment;
}

export async function deriveIntent(
  preimage: string,
  recipientAddress: string,
): Promise<Intent> {
  if (!deployment) throw new Error("intent-lock.bc is not deployed");
  if (!preimage) throw new Error("Enter a lock preimage");

  const recipient = await ccc.Address.fromString(recipientAddress, cccClient);
  const preimageHash = ccc.hashCkb(textToHex(preimage));
  const recipientLockHash = ccc.hashCkb(recipient.script.toBytes());
  const args =
    "0x0000" +
    deployment.codeHash.slice(2) +
    hexFrom(hashTypeToBytes(deployment.hashType)).slice(2) +
    preimageHash.slice(2) +
    recipientLockHash.slice(2);

  const lock = ccc.Script.from({
    codeHash: ckbJsVm.script.codeHash,
    hashType: ckbJsVm.script.hashType,
    args,
  });

  return {
    address: ccc.Address.fromScript(lock, cccClient).toString(),
    lock,
    preimageHash,
    recipientLockHash,
  };
}

export async function readCapacity(intent: Intent) {
  return cccClient.getBalance([intent.lock]);
}

export async function readTip() {
  return cccClient.getTip();
}

export async function getLimits(
  intent: Intent,
  recipientAddress: string,
  knownCapacity?: bigint,
): Promise<Limits> {
  const recipient = await ccc.Address.fromString(recipientAddress, cccClient);
  const available = knownCapacity ?? (await readCapacity(intent));
  const recipientMinimum = ccc.fixedPointFrom(
    ccc.CellOutput.from({ capacity: 0n, lock: recipient.script }).occupiedSize,
  );
  const changeMinimum = ccc.fixedPointFrom(
    ccc.CellOutput.from({ capacity: 0n, lock: intent.lock }).occupiedSize,
  );
  const maximum =
    available > changeMinimum + FEE ? available - changeMinimum - FEE : 0n;

  return { available, recipientMinimum, changeMinimum, maximum, fee: FEE };
}

export async function unlock(
  intent: Intent,
  recipientAddress: string,
  amount: string,
  witness: string,
) {
  if (!witness) throw new Error("Enter a witness preimage");

  const recipient = await ccc.Address.fromString(recipientAddress, cccClient);
  const transfer = parseCkb(amount);
  const limits = await getLimits(intent, recipientAddress);
  if (transfer < limits.recipientMinimum) {
    throw new Error(
      `Recipient output requires ${formatCkb(limits.recipientMinimum)} CKB`,
    );
  }
  if (transfer > limits.maximum) {
    throw new Error(`Maximum available transfer is ${formatCkb(limits.maximum)} CKB`);
  }

  const signer = new ccc.SignerCkbScriptReadonly(cccClient, intent.lock);
  const transaction = ccc.Transaction.from({
    outputs: [{ lock: recipient.script, capacity: transfer }],
    outputsData: [],
  });
  await transaction.addCellDeps(deployment.cellDeps[0].cellDep);
  await transaction.addCellDeps(ckbJsVm.script.cellDeps[0].cellDep);
  await transaction.completeInputsByCapacity(
    signer,
    limits.changeMinimum + limits.fee,
  );

  const inputCapacity = await transaction.getInputsCapacity(cccClient);
  const change = inputCapacity - transfer - limits.fee;
  transaction.addOutput({ lock: intent.lock, capacity: change });
  transaction.setWitnessArgsAt(0, new ccc.WitnessArgs(textToHex(witness)));

  const txHash = await cccClient.sendTransaction(transaction);
  return { txHash, inputCapacity, transfer, change, fee: limits.fee };
}

export async function waitForCommit(txHash: string, timeout = 240000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const transaction = await cccClient.getTransaction(txHash);
    if (transaction?.status === "committed") return transaction;
    if (transaction?.status === "rejected") {
      throw new Error(transaction.reason ?? "Transaction rejected");
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`Timed out waiting for ${txHash}`);
}
