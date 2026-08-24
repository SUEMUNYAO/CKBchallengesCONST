# Campaign 04 Proof — Create a DOB

## Step 1: OffCKB Setup

Installed OffCKB CLI and started local devnet. Verified the node was running at `http://127.0.0.1:28114`.

## Step 2: Project Setup

Cloned the Create a DOB tutorial, installed dependencies with pnpm, and configured Spore SDK for both devnet and testnet.

## Step 3: DOB Creation (Testnet)

Ran `NETWORK=testnet tsx testnet-dob.ts` which:
- Read a 338-byte JPEG image
- Built a CKB transaction with the image data in a Spore Cell
- Signed and broadcast the transaction
- Waited for confirmation and decoded the image back from chain

**Transaction:** https://testnet.explorer.nervos.org/transaction/0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019

## Step 4: Browser Rendering

The React frontend reads the on-chain cell, unpacks the Spore data, and renders the image using `URL.createObjectURL()`. Round-trip integrity verified: original and decoded images have identical SHA-256 hashes (`9bb1d03ba711f423dcfc59de87dded85faaf7966e3b74c4ec6fde458edcb9936`).

## Step 5: Testnet Deployment

Successfully deployed to CKB Pudge Testnet. The DOB is live on-chain and can be verified via the explorer link above or by running the RPC verification command in the proof README.

## Verification

```bash
# Check image integrity
sha256sum sample-dob-image.jpg decoded-dob-testnet.jpg
# Both: 9bb1d03ba711f423dcfc59de87dded85faaf7966e3b74c4ec6fde458edcb9936
```
