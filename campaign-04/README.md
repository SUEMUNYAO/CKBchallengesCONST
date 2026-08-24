# Build on CKB Campaign #04 — Create a DOB

This directory contains the complete Campaign #04 submission for the official
[Create a DOB](https://docs.nervos.org/docs/dapp/create-dob) tutorial.

## What I Built

A dApp that converts an image file into an immutable on-chain Digital Object
(DOB) using the Spore SDK, then renders the image back from the blockchain data.

## Completed Requirements

| Requirement | Status | Details |
|------------|--------|--------|
| Deploy on-chain DOB with image via Spore-SDK | ✅ | [Testnet transaction](https://testnet.explorer.nervos.org/transaction/0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019) |
| Render image in browser from DOB | ✅ | Round-trip integrity verified (338 bytes → 338 bytes) |
| Deploy app to testnet | ✅ | [Testnet explorer](https://testnet.explorer.nervos.org/transaction/0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019) |

## Project Structure

```
campaign-04/
├── README.md                    # This file
├── proof/
│   └── README.md                # Proof documentation
├── create-dob/                  # Tutorial dApp
│   ├── create-dob.ts            # Devnet DOB creation script
│   ├── testnet-dob.ts           # Testnet DOB creation script
│   ├── decode-testnet.ts        # Testnet verification script
│   ├── lib.ts                   # Core Spore SDK functions
│   ├── helper.ts                # Wallet and utility functions
│   ├── ccc-client.ts            # CKB client configuration
│   ├── spore-config.ts          # Spore protocol configuration
│   ├── index.tsx                # React frontend
│   ├── index.html               # HTML entry point
│   ├── package.json             # Dependencies
│   ├── tsconfig.json            # TypeScript config
│   ├── system-scripts.json      # System script definitions
│   ├── sample-dob-image.jpg     # Input image
│   └── .gitignore               # Git ignore rules
```

## How It Works

### 1. Create Digital Object

The Spore SDK's `createSpore()` function builds a CKB transaction that
produces a Spore Cell containing the image data:

```typescript
const { txSkeleton, outputIndex } = await createSpore({
  data: {
    contentType: "image/jpeg",
    content: imageBytes,
  },
  toLock: wallet.lock,
  fromInfos: [wallet.address],
  config: SPORE_CONFIG,
});
```

### 2. Render from Chain

The `unpackToRawSporeData()` function decodes the on-chain cell data back
into content-type and content fields, which can be rendered as an image
in the browser:

```typescript
const cell = await client.getCellLive({ txHash, index: indexHex }, true);
const sporeData = unpackToRawSporeData(cell.outputData);
const blob = new Blob([decodedBytes], { type: sporeData.contentType });
const imageURL = URL.createObjectURL(blob);
```

## Reproduce

### Prerequisites

- Node.js 22+
- pnpm
- OffCKB CLI (>= 0.4.0)

### Devnet

```bash
# Start devnet
offckb node

# In another terminal
cd campaign-04/create-dob
pnpm install
NETWORK=devnet ./node_modules/.bin/tsx create-dob.ts
```

### Testnet

```bash
# Get testnet CKB from https://faucet.nervos.org/
# Then:
NETWORK=testnet ./node_modules/.bin/tsx testnet-dob.ts
```

### Frontend

```bash
NETWORK=devnet npm start
# Open http://localhost:1234
```

## Reflection

See [reflection.md](reflection.md) for a detailed reflection on what I learned,
the unique characteristics of DOBs vs NFTs, and interesting use cases.

## Resources

- [Create a DOB Tutorial](https://docs.nervos.org/docs/dapp/create-dob)
- [DOB Protocol Cookbook](https://github.com/sporeprotocol/dob-cookbook)
- [Spore Protocol Docs](https://docs.spore.pro/dob/Introduction)
- [CCC SDK (JavaScript/TypeScript)](https://github.com/ckb-js/ckb-sdk-js)
- [OffCKB CLI](https://docs.nervos.org/docs/sdk-and-devtool/offckb)
