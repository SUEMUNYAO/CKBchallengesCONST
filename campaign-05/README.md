# Build on CKB Campaign 05 - Cell Token Desk

This package completes the official [Create a Fungible Token](https://docs.nervos.org/docs/dapp/create-token) tutorial on a local OffCKB devnet. The dApp is a small three-stage desk for issuing an xUDT, finding its cells with the issuer Lock Script Hash, and transferring part of the balance by changing the output Lock Script.

## Run the dApp

Start OffCKB in one terminal:

```bash
offckb node
```

Then run the page in another terminal:

```bash
cd campaign-05/token-demo
npm install
npm run lint
npm run build
NETWORK=devnet npm start
```

Open `http://localhost:1246`.

## Verify the transactions

The verifier keeps private keys outside the repository. Use two local-only accounts from `offckb accounts`:

```bash
cd campaign-05
OWNER_KEY=0x... \
TO_ADDRESS=ckt1... \
MINT_QTY=6840 \
SEND_QTY=1730 \
node records/check-token.mjs
```

The verified run issued `6840` tokens, found the issued cell by passing the issuer Lock Script Hash, transferred `1730` to another account, and returned `5110` to the issuer. These transactions exist only on the local OffCKB chain.

See [records/README.md](records/README.md) for the transaction hashes and captured proof. The participant should use [records/reflection-notes.md](records/reflection-notes.md) only as factual prompts and write the campaign reflection personally.
