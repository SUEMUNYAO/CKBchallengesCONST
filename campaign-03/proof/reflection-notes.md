# Personal reflection notes

Do not submit this file verbatim. Use the moments that match your experience
and write the final reflection in your own voice.

## Concrete moments

- The scaffold test API returned a promise, so the initial harness failed until
  each VM verification was awaited.
- A correct preimage was not enough in this contract. Redirecting output zero
  produced exit code 13 because the recipient lock hash was committed in args.
- The 99-byte lock arguments raised the occupied-capacity floor of the change
  cell to 140 CKB. The frontend calculated this before enabling a spend.
- The wrong witness produced exit code 11 and left the 360 CKB cell untouched.
- The frontend waited for committed status, then refreshed to 239.99999 CKB.

## Security boundary

The basic tutorial lock proves knowledge, not identity. Its preimage becomes
public in the witness and can be copied from a pending transaction.

Recipient binding narrows that weakness because a copied witness cannot simply
redirect output zero to another lock. It is still incomplete: this version does
not commit the recipient amount or constrain every change output. A stronger
design would commit the full spend intent, rotate change to a fresh secret, add
an owner signature, and include a timeout recovery path.
