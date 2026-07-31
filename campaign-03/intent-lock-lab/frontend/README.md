# Intent Lock Console

This is the Campaign 03 frontend for the recipient-bound intent lock.

It derives the lock from a preimage and a committed recipient, queries live
capacity from the OffCKB proxy RPC, and submits both rejected and accepted
witness attempts. The browser does not hold a private key.

Run the production build:

```bash
cp .env.example .env.local
npm install
npm run typecheck
npm run build
npm run start
```

The frontend listens at `http://127.0.0.1:3001`.
