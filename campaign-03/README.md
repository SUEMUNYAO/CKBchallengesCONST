# Build on CKB Campaign 03

This local package completes the official
[Build a Simple Lock](https://docs.nervos.org/docs/dapp/simple-lock) tutorial
for the `SUEMUNYAO` account on an OffCKB private devnet.

The custom `intent-lock` extends the tutorial hash lock by committing the
intended recipient lock hash alongside the preimage hash. The required
frontend is Intent Lock Console, a focused interface for deriving the lock,
observing its capacity, and submitting rejected or accepted witnesses.

## Verified result

- OffCKB CLI: `0.4.6`
- RPC: `http://127.0.0.1:28114`
- Code hash: `0xf223d4ed8d528e7bdc42f39fc80d39f0db02199684d8dd30cc04b123e73b2f36`
- Deployment: `0xe54a18c3a5bfc8a120e8295035afbb71b64b424e4082dcb4b7419af397ab6be0`
- 360 CKB deposit: `0x4f6e538670b2b3620bc69b14b5a71b3c1709a9dc5ac59b80df8ad70b899a582f`
- Frontend unlock: `0x784f8f1651aac620924db86794882464dcfc8178a1975cd90e5ca68ede062705`
- Wrong preimage: rejected with exit code `11`
- Unlock: `120 CKB` recipient, `239.99999 CKB` change, `0.00001 CKB` fee
- Portable verification: `47` checks

## Package

- [Implementation and reviewer commands](intent-lock-lab/README.md)
- [Proof index](proof/README.md)
- [Machine-readable result](proof/campaign-03-result.json)

These hashes belong to a private local chain and will not appear on public CKB
explorers. Raw RPC responses and the offline verifier are included.

Nothing in this package has been committed or pushed.
