# Reflection Notes

Important: CKBoost asks for a reflection in your own words. Treat these as source notes from the actual run, then rewrite the final submission in your own voice.

The angle for this repo is the cell as a journal page. The useful part of the tutorial was not only sending a transaction, but watching a readable sentence go through a full lifecycle: text, bytes, hex, output data, committed cell, live-cell lookup, and decoded text again.

A good observation is that the out point works like the page number for that journal entry. The transaction hash says which transaction created the entry, and the output index says exactly which cell holds it. Without both pieces, the data is less precise.

Another thing worth mentioning is that the journal cell did not need a custom contract. The lock script protects ownership, while the cell data carries the entry. That makes CKB feel more object-based than contract-storage-based.

The capacity detail is also interesting. The transaction builder funded the journal cell and created a change output, which shows that storing data is tied to occupying state. Even a short sentence has a cell, a lock, capacity, and a lifecycle.

Possible final direction: describe the tutorial as learning how to write, locate, and reopen a tiny on-chain journal entry rather than just "saving data" in a generic way.
