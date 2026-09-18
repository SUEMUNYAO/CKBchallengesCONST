# Personal Reflection Prompts

Use these facts to write an original reflection in your own voice. They are not a finished campaign response.

- `6840` was encoded in an xUDT cell's data as a 16-byte little-endian number.
- The issuer Lock Script Hash became the token identifier, followed by the four-byte extension placeholder in the xUDT args.
- A query using that issuer hash found every live cell carrying the same xUDT Type Script.
- The transfer retained the xUDT Type Script but placed `1730` under the receiver's Lock Script.
- The transaction produced a separate `5110` change cell for the issuer, similar to spending a UTXO and receiving change.
- Consider which part was unexpected, what you had to inspect while running OffCKB, and a token use case you personally care about.
