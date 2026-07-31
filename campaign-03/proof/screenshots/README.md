# Screenshot Provenance

Every image in this directory is a direct capture of the named application.
No image contains an added frame, label, annotation, transaction value, or
simulated terminal output.

The terminal images capture GNOME Terminal windows running the commands shown
in the image. The frontend images capture the production Next.js application
connected to the local OffCKB RPC. `06-wrong-witness-rejected.png` records the
real rejected transaction attempt; `07-correct-witness-committed.png` records
the later committed transaction.

The transaction hashes and state claims visible in these images are checked
against `../rpc-evidence.json` by the offline verifier.
