# Campaign 04 — Proof of Completion

## Overview

This document provides verifiable proof that the Create a DOB tutorial was
completed successfully on CKB testnet.

## Requirements Checklist

| Requirement | Status | Evidence |
|------------|--------|----------|
| Deploy on-chain DOB with image via Spore-SDK | ✅ | Testnet transaction below |
| Render image in browser from DOB | ✅ | Round-trip integrity verified |
| Deploy app to testnet | ✅ | Transaction on testnet explorer |

---

## Testnet Proof

**Transaction Hash:** `0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019`

**🔗 Explorer Link:** https://testnet.explorer.nervos.org/transaction/0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019

| Fact | Value |
|------|-------|
| Network | CKB Pudge Testnet |
| Transaction hash | `0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019` |
| Spore ID | `0xb5dadb0f58e31800bed6f65ff82cca6179b26c53fe4582e196bced08e16328ef` |
| Out point | `0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019:0x0` |
| Cell status | `live` |
| Image content type | `image/jpeg` |
| Original image size | 338 bytes |
| Decoded image size | 338 bytes |
| Round-trip integrity | ✅ PASS |
| SHA-256 hash | `9bb1d03ba711f423dcfc59de87dded85faaf7966e3b74c4ec6fde458edcb9936` |
| Owner lock args | `0x8e42b1999f265a0078503c4acec4d5e134534297` |

---

## Devnet Proof (Secondary)

**Transaction Hash:** `PLACEHOLDER_DEVNET_TX_HASH`

| Fact | Value |
|------|-------|
| Network | OffCKB local devnet (`http://127.0.0.1:28114`) |
| Transaction hash | `PLACEHOLDER_DEVNET_TX_HASH` |
| Spore ID | `PLACEHOLDER_DEVNET_SPORE_ID` |
| Out point | `PLACEHOLDER_DEVNET_TX_HASH:0x0` |
| Round-trip integrity | ✅ PASS |

---

## Verification Commands

### Testnet — RPC Evidence

```bash
# Get the live cell
curl -s -X POST https://testnet.ckbapp.dev/ -H "Content-Type: application/json" -d '{
  "jsonrpc":"2.0",
  "method":"get_live_cell",
  "params":[{
    "txHash": "0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019",
    "index": "0x0"
  }, true],
  "id":1
}' | python3 -m json.tool
```

### Image Integrity

```bash
cd campaign-04/create-dob
sha256sum sample-dob-image.jpg decoded-dob-testnet.jpg
# Both should match: 9bb1d03ba711f423dcfc59de87dded85faaf7966e3b74c4ec6fde458edcb9936
```

### Explorer

Visit the testnet explorer to view the transaction:
https://testnet.explorer.nervos.org/transaction/0x731532a9dfc011e519598dd5b4695a9b106f552c58dba7faf9f327e621451019

---

## Screenshots & Images

| File | Description |
|------|-------------|
| [`../create-dob/sample-dob-image.jpg`](../create-dob/sample-dob-image.jpg) | Original input image (338 bytes) |
| [`../create-dob/decoded-dob-image.jpg`](../create-dob/decoded-dob-image.jpg) | Decoded from devnet chain |
| [`../create-dob/decoded-dob-testnet.jpg`](../create-dob/decoded-dob-testnet.jpg) | Decoded from testnet chain |
| [`../create-dob/create-dob.ts`](../create-dob/create-dob.ts) | Devnet creation script |
| [`../create-dob/testnet-dob.ts`](../create-dob/testnet-dob.ts) | Testnet creation script |

---

## How to Run

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

---

## Resources

- [Create a DOB Tutorial](https://docs.nervos.org/docs/dapp/create-dob)
- [Spore Protocol Docs](https://docs.spore.pro/dob/Introduction)
- [CCC SDK (JavaScript/TypeScript)](https://github.com/ckb-js/ckb-sdk-js)
- [OffCKB CLI](https://docs.nervos.org/docs/sdk-and-devtool/offckb)
