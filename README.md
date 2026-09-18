# CKBchallengesCONST

Local implementations and reviewer-verifiable proof for Build on CKB campaigns.

## Campaign 02 - Store Data on Cell

The official Store Data on Cell tutorial is implemented as a cell journal.

Proof: [campaign-02-proof](campaign-02-proof/README.md)

- Transaction: `0x5af43d4266412311a273748b20f2872b424b5df0f96beb74d7f7d0de0ad4576b`
- Live cell status: `live`
- Reopened text: `SUEMUNYAO Campaign 2 journal entry: this cell holds a receipt I can reopen by out point.`

## Campaign 03 - Build a Simple Lock

The official Build a Simple Lock tutorial is implemented as a recipient-bound
intent lock with a production frontend for funding, rejecting a mismatched
witness, and committing a valid unlock.

Campaign package: [campaign-03](campaign-03/README.md)

## Campaign 04 - Create a DOB

The official Create a DOB tutorial is implemented as a dApp that converts an
image file into an immutable on-chain Digital Object (DOB) using the Spore SDK,
then renders the image back from the blockchain data.

Campaign package: [campaign-04](campaign-04/README.md)

Proof: [campaign-04/proof](campaign-04/proof/README.md)

## Campaign 05 - Create a Fungible Token

The official Create a Fungible Token tutorial is implemented as Cell Token Desk. It issues an xUDT, queries its live cells by issuer Lock Script Hash, and transfers a partial balance to a different Lock Script on the local OffCKB devnet.

Campaign package: [campaign-05](campaign-05/README.md)
