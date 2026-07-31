# Intent Lock Lab

This project completes the official Build a Simple Lock tutorial on an OffCKB
local devnet. The custom lock commits to two values:

1. The CKB Blake2b-256 hash of the witness preimage.
2. The CKB script hash of output zero, which binds the spend to a recipient.

The production frontend derives the same lock, reads its live capacity, and
submits rejected and accepted witness attempts without placing a private key
in the browser.

## Verified devnet result

| Fact | Value |
| --- | --- |
| Deployment | `0xe54a18c3a5bfc8a120e8295035afbb71b64b424e4082dcb4b7419af397ab6be0` |
| Code hash | `0xf223d4ed8d528e7bdc42f39fc80d39f0db02199684d8dd30cc04b123e73b2f36` |
| Deposit | `0x4f6e538670b2b3620bc69b14b5a71b3c1709a9dc5ac59b80df8ad70b899a582f` |
| Unlock | `0x784f8f1651aac620924db86794882464dcfc8178a1975cd90e5ca68ede062705` |
| Wrong witness | Rejected with exit code `11` |
| Transfer | `120 CKB` |
| Change | `239.99999 CKB` |
| Fee | `0.00001 CKB` |

## Contract exits

| Code | Meaning |
| --- | --- |
| `0` | Preimage and recipient accepted |
| `10` | Witness missing or empty |
| `11` | Preimage mismatch |
| `12` | Script arguments malformed |
| `13` | Output zero does not match the committed recipient |

## Reproduce

```bash
npm install
npm run test:mock
npm run deploy -- --yes
npm --prefix frontend install
npm run frontend:typecheck
npm run frontend:build
npm --prefix frontend run start
```

The production frontend listens at `http://127.0.0.1:3001`.

## Reviewer verification

The offline proof check does not require this private devnet:

```bash
npm run verify:offline
npm run verify:integrity
```

Run the complete build, VM test, frontend, proof, and integrity gate:

```bash
npm run verify:submission
```

The proof package is indexed at [../proof/README.md](../proof/README.md).
