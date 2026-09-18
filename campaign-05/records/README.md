# Campaign 05 Records

This directory contains the local proof for Cell Token Desk. The run used OffCKB account 8 as issuer and account 9 as receiver. No private key is stored in these files.

| Check | Recorded result |
| --- | --- |
| DApp | `http://localhost:1246/?proof=1` |
| Issuer Lock Script Hash | `0x335cbbb35e2475293aa2b813c9a841532d17448175b89b5851cc31d696ec1b56` |
| xUDT args | `0x335cbbb35e2475293aa2b813c9a841532d17448175b89b5851cc31d696ec1b5600000000` |
| Issue `6840` | `0x3e11da8b2408926cb94420f931d385809ae130b019ca5336127c730ac8382f99` |
| Transfer `1730` | `0x29a340709c3e8e26b8ee7786fef4bc4f521867bbf7a3ce8b1746c53916532355` |
| Issuer change | `5110` |

The issue transaction first produced one xUDT cell containing `6840`. Passing the issuer Lock Script Hash to the query reconstructed the xUDT args and returned that cell. The transfer then spent it into two live cells with the same Type Script: `1730` under the receiver Lock Script and `5110` under the issuer Lock Script.

Files:

- `check-token.mjs` executes and validates the complete flow. Secrets are accepted through environment variables.
- `token.json` is the machine-readable result.
- `token.log` is the concise run record.
- `token-screen.png` shows the populated dApp at a `1500 x 1000` browser viewport. The private-key input is empty and masked.
- `reflection-notes.md` contains factual prompts for a personally written reflection.

The transaction hashes identify blocks on this local OffCKB chain. They are not public Testnet or Mainnet explorer links.
