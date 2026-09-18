import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ccc } = require("../token-demo/node_modules/@ckb-ccc/core/dist.commonjs/index.js");

const ownerKey = process.env.OWNER_KEY;
const toAddress = process.env.TO_ADDRESS;
const mintQty = process.env.MINT_QTY ?? "6840";
const sendQty = process.env.SEND_QTY ?? "1730";

if (!ownerKey || !toAddress) {
  throw new Error("OWNER_KEY and TO_ADDRESS are required");
}

const known = {
  [ccc.KnownScript.Secp256k1Blake160]: {
    codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
    cellDeps: [{
      cellDep: {
        outPoint: {
          txHash: "0x4d804f1495612631da202fe9902fa9899118554b08138cfe5dfb50e1ede76293",
          index: 0,
        },
        depType: "depGroup",
      },
    }],
  },
  [ccc.KnownScript.Secp256k1Multisig]: {
    codeHash: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    hashType: "type",
    cellDeps: [{
      cellDep: {
        outPoint: {
          txHash: "0x4d804f1495612631da202fe9902fa9899118554b08138cfe5dfb50e1ede76293",
          index: 1,
        },
        depType: "depGroup",
      },
    }],
  },
  [ccc.KnownScript.AnyoneCanPay]: {
    codeHash: "0xe09352af0066f3162287763ce4ddba9af6bfaeab198dc7ab37f8c71c9e68bb5b",
    hashType: "type",
    cellDeps: [{
      cellDep: {
        outPoint: {
          txHash: "0x1bb87da347a776a927ab6593e1e10304ca195f8e24279f039008d5e3115b1bf7",
          index: 8,
        },
        depType: "code",
      },
    }],
  },
  [ccc.KnownScript.OmniLock]: {
    codeHash: "0x9c6933d977360f115a3e9cd5a2e0e475853681b80d775d93ad0f8969da343e56",
    hashType: "type",
    cellDeps: [
      {
        cellDep: {
          outPoint: {
            txHash: "0x1bb87da347a776a927ab6593e1e10304ca195f8e24279f039008d5e3115b1bf7",
            index: 7,
          },
          depType: "code",
        },
      },
      {
        cellDep: {
          outPoint: {
            txHash: "0x4d804f1495612631da202fe9902fa9899118554b08138cfe5dfb50e1ede76293",
            index: 0,
          },
          depType: "depGroup",
        },
      },
    ],
  },
  [ccc.KnownScript.XUdt]: {
    codeHash: "0x1a1e4fef34f5982906f745b048fe7b1089647e82346074e0f32c2ece26cf6b1e",
    hashType: "type",
    cellDeps: [{
      cellDep: {
        outPoint: {
          txHash: "0x1bb87da347a776a927ab6593e1e10304ca195f8e24279f039008d5e3115b1bf7",
          index: 6,
        },
        depType: "code",
      },
    }],
  },
  [ccc.KnownScript.NervosDao]: {
    codeHash: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
    hashType: "type",
    cellDeps: [{
      cellDep: {
        outPoint: {
          txHash: "0x1bb87da347a776a927ab6593e1e10304ca195f8e24279f039008d5e3115b1bf7",
          index: 2,
        },
        depType: "code",
      },
    }],
  },
};

const rpc = new ccc.ClientPublicTestnet({
  url: "http://127.0.0.1:28114",
  scripts: known,
});
const wallet = new ccc.SignerCkbPrivateKey(rpc, ownerKey);
const ownerAddress = await wallet.getAddressObjSecp256k1();
const owner = ownerAddress.script;
const ownerHash = owner.hash();
const tokenArgs = `${ownerHash}00000000`;
const token = await ccc.Script.fromKnownScript(
  rpc,
  ccc.KnownScript.XUdt,
  tokenArgs,
);
const receiver = (await ccc.Address.fromString(toAddress, rpc)).script;

const plain = (value) =>
  JSON.parse(JSON.stringify(value, (_, item) =>
    typeof item === "bigint" ? item.toString() : item,
  ));

async function findByOwnerHash(hash) {
  const args = `${hash}00000000`;
  const type = await ccc.Script.fromKnownScript(
    rpc,
    ccc.KnownScript.XUdt,
    args,
  );
  const found = [];
  for await (const cell of rpc.findCellsByType(type, true)) {
    found.push({
      outPoint: plain(cell.outPoint),
      amount: ccc.numLeFromBytes(cell.outputData).toString(),
      holderLockArgs: cell.cellOutput.lock.args,
      typeArgs: cell.cellOutput.type?.args,
    });
  }
  return found;
}

console.log(JSON.stringify({
  stage: "wallet",
  ownerAddress: ownerAddress.toString(),
  ownerLockHash: ownerHash,
  receiverLockArgs: receiver.args,
}, null, 2));

const mint = ccc.Transaction.from({
  outputs: [{ lock: owner, type: token }],
  outputsData: [ccc.numLeToBytes(mintQty, 16)],
});
await mint.addCellDepsOfKnownScripts(rpc, ccc.KnownScript.XUdt);
await mint.completeInputsByCapacity(wallet);
await mint.completeFeeBy(wallet, 1000);
const mintHash = await wallet.sendTransaction(mint);
await rpc.waitTransaction(mintHash, 0, 120000, 1000);
console.log(JSON.stringify({
  stage: "issue",
  transaction: mintHash,
  amount: mintQty,
  tokenArgs,
}, null, 2));

const firstLook = await findByOwnerHash(ownerHash);
if (!firstLook.some((cell) => cell.amount === mintQty)) {
  throw new Error("Issued token cell was not returned by the owner lock hash query");
}
console.log(JSON.stringify({
  stage: "query",
  passedOwnerLockHash: ownerHash,
  cells: firstLook,
}, null, 2));

const send = ccc.Transaction.from({
  outputs: [{ lock: receiver, type: token }],
  outputsData: [ccc.numLeToBytes(sendQty, 16)],
});
await send.completeInputsByUdt(wallet, token);
const change =
  (await send.getInputsUdtBalance(rpc, token)) - send.getOutputsUdtBalance(token);
if (change > ccc.Zero) {
  send.addOutput({ lock: owner, type: token }, ccc.numLeToBytes(change, 16));
}
await send.addCellDepsOfKnownScripts(rpc, ccc.KnownScript.XUdt);
await send.completeInputsByCapacity(wallet);
await send.completeFeeBy(wallet, 1000);
const sendHash = await wallet.sendTransaction(send);
await rpc.waitTransaction(sendHash, 0, 120000, 1000);

const lastLook = await findByOwnerHash(ownerHash);
const receiverCell = lastLook.find((cell) =>
  cell.holderLockArgs === receiver.args && cell.amount === sendQty
);
const ownerCell = lastLook.find((cell) =>
  cell.holderLockArgs === owner.args && cell.amount === change.toString()
);
if (!receiverCell || !ownerCell) {
  throw new Error("Transferred balance or owner change cell is missing");
}
console.log(JSON.stringify({
  stage: "transfer",
  transaction: sendHash,
  sent: sendQty,
  ownerChange: change.toString(),
  receiverCell,
  ownerCell,
}, null, 2));

console.log(JSON.stringify({
  stage: "complete",
  network: "local-offckb-devnet",
  mintHash,
  sendHash,
  ownerLockHash: ownerHash,
  tokenArgs,
  minted: mintQty,
  sent: sendQty,
  ownerChange: change.toString(),
  liveCellCount: lastLook.length,
}, null, 2));
