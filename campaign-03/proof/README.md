# Campaign 03 Proof

This package proves the complete Build a Simple Lock lifecycle on an OffCKB
local devnet.

## Requirement map

| Requirement | Evidence |
| --- | --- |
| OffCKB running | Environment terminal screenshot and log |
| Custom lock built | Source, bytecode, five VM outcomes, build screenshot |
| Custom lock deployed | Deployment metadata, committed RPC transaction, terminal screenshot |
| Required frontend | Production build and literal desktop/mobile screenshots |
| Tokens locked | Committed 360 CKB deposit and funded frontend state |
| Wrong preimage rejected | Visible exit code 11 and unchanged 360 CKB cell |
| Correct preimage unlocks | Committed frontend transaction and live outputs |
| Portable review | Raw RPC snapshot, 47-check verifier, SHA-256 manifest |

## Transaction ledger

### Deployment

- Transaction: `0xe54a18c3a5bfc8a120e8295035afbb71b64b424e4082dcb4b7419af397ab6be0`
- Status: `committed`
- Code hash: `0xf223d4ed8d528e7bdc42f39fc80d39f0db02199684d8dd30cc04b123e73b2f36`
- Bytecode SHA-256: `7bdfa592ff226a35a307819b70de5e154724e30db773ab86b4a8ebc3719ff351`

### Deposit

- Transaction: `0x4f6e538670b2b3620bc69b14b5a71b3c1709a9dc5ac59b80df8ad70b899a582f`
- Capacity: `360 CKB`
- Output: `0`
- Final state: spent

### Frontend attempts

The frontend first submitted `paper cranes cross midday`. The node rejected
the transaction with contract exit code `11`; the 360 CKB input remained live.

The matching witness `paper cranes cross midnight` then committed:

- Transaction: `0x784f8f1651aac620924db86794882464dcfc8178a1975cd90e5ca68ede062705`
- Recipient: `120 CKB`, live
- Intent-lock change: `239.99999 CKB`, live
- Fee: `0.00001 CKB`

## Screenshots

1. `screenshots/01-offckb-environment.png` - literal environment terminal
2. `screenshots/02-contract-build.png` - literal contract build and bytecode checksum terminal
3. `screenshots/02-contract-build-tests.png` - literal five-case VM test terminal
4. `screenshots/03-deployment-rpc.png` - literal deployment/RPC terminal
5. `screenshots/04-frontend-empty.png` - production frontend before funding
6. `screenshots/05-frontend-funded.png` - committed 360 CKB deposit
7. `screenshots/06-wrong-witness-rejected.png` - visible exit code 11
8. `screenshots/07-correct-witness-committed.png` - committed unlock
9. `screenshots/08-mobile-committed.png` - responsive committed state
10. `screenshots/09-offline-verifier.png` - literal verifier terminal

The terminal screenshots are direct terminal captures. The application
screenshots are direct browser captures. None contain added annotations.
Capture provenance is recorded in `screenshots/README.md`.

## Raw evidence

- `rpc-evidence.json` - raw transaction and live-cell RPC responses
- `campaign-03-result.json` - concise result ledger
- `logs/04-deployment.log` - deployment terminal recording
- `logs/05-deposit.log` - deposit terminal recording
- `logs/07-rpc-proof.log` - RPC collection terminal recording

## Reviewer commands

```bash
cd campaign-03/intent-lock-lab
npm run verify:offline
npm run verify:integrity
```

The offline verifier performs 47 checks without contacting the private node.
