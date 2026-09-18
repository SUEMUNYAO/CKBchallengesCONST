import { ccc, type Hex } from "@ckb-ccc/core";
import { chain } from "./net";

const tokenType = (ownerHash: Hex) =>
  ccc.Script.fromKnownScript(
    chain,
    ccc.KnownScript.XUdt,
    `${ownerHash}00000000`,
  );

export async function readWallet(key: Hex) {
  const wallet = new ccc.SignerCkbPrivateKey(chain, key);
  const place = await wallet.getAddressObjSecp256k1();
  const capacity = await chain.getBalance([place.script]);
  return {
    address: place.toString(),
    lockHash: place.script.hash(),
    capacity: ccc.fixedPointToString(capacity),
  };
}

export async function makeCoin(key: Hex, qty: string) {
  const wallet = new ccc.SignerCkbPrivateKey(chain, key);
  const owner = (await wallet.getAddressObjSecp256k1()).script;
  const kind = await tokenType(owner.hash());
  const mint = ccc.Transaction.from({
    outputs: [{ lock: owner, type: kind }],
    outputsData: [ccc.numLeToBytes(qty, 16)],
  });

  await mint.addCellDepsOfKnownScripts(chain, ccc.KnownScript.XUdt);
  await mint.completeInputsByCapacity(wallet);
  await mint.completeFeeBy(wallet, 1000);
  const hash = await wallet.sendTransaction(mint);
  await chain.waitTransaction(hash, 0, 120000, 1000);
  return { hash, ownerHash: owner.hash(), args: kind.args };
}

export async function scanCoin(ownerHash: Hex) {
  const kind = await tokenType(ownerHash);
  const rows: Array<{ outPoint: string; amount: string; holder: string }> = [];

  for await (const cell of chain.findCellsByType(kind, true)) {
    rows.push({
      outPoint: `${cell.outPoint.txHash}:${cell.outPoint.index}`,
      amount: ccc.numLeFromBytes(cell.outputData).toString(),
      holder: cell.cellOutput.lock.args,
    });
  }
  return rows;
}

export async function moveCoin(
  key: Hex,
  ownerHash: Hex,
  qty: string,
  to: string,
) {
  const wallet = new ccc.SignerCkbPrivateKey(chain, key);
  const owner = (await wallet.getAddressObjSecp256k1()).script;
  const holder = (await ccc.Address.fromString(to, chain)).script;
  const kind = await tokenType(ownerHash);
  const send = ccc.Transaction.from({
    outputs: [{ lock: holder, type: kind }],
    outputsData: [ccc.numLeToBytes(qty, 16)],
  });

  await send.completeInputsByUdt(wallet, kind);
  const rest =
    (await send.getInputsUdtBalance(chain, kind)) -
    send.getOutputsUdtBalance(kind);
  if (rest > ccc.Zero) {
    send.addOutput(
      { lock: owner, type: kind },
      ccc.numLeToBytes(rest, 16),
    );
  }
  await send.addCellDepsOfKnownScripts(chain, ccc.KnownScript.XUdt);
  await send.completeInputsByCapacity(wallet);
  await send.completeFeeBy(wallet, 1000);
  const hash = await wallet.sendTransaction(send);
  await chain.waitTransaction(hash, 0, 120000, 1000);
  return { hash, change: rest.toString(), receiverLock: holder.args };
}
