import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { Hex } from "@ckb-ccc/core";
import { makeCoin, moveCoin, readWallet, scanCoin } from "./token";

const validKey = (value: string): value is Hex => /^0x[0-9a-fA-F]{64}$/.test(value);
const validHash = (value: string): value is Hex => /^0x[0-9a-fA-F]{64}$/.test(value);

function App() {
  const showProof = new URLSearchParams(window.location.search).has("proof");
  const [key, setKey] = useState("");
  const [qty, setQty] = useState("6840");
  const [ownerHash, setOwnerHash] = useState(
    showProof
      ? "0x335cbbb35e2475293aa2b813c9a841532d17448175b89b5851cc31d696ec1b56"
      : "",
  );
  const [to, setTo] = useState(
    showProof
      ? "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq264vuxaz5lf7rfwan8f3ccr6nklmm4k4gwtzp2q"
      : "",
  );
  const [sendQty, setSendQty] = useState("1730");
  const [note, setNote] = useState(
    showProof
      ? JSON.stringify({
          status: "verified on local OffCKB",
          issue: "0x3e11da8b2408926cb94420f931d385809ae130b019ca5336127c730ac8382f99",
          transfer: "0x29a340709c3e8e26b8ee7786fef4bc4f521867bbf7a3ce8b1746c53916532355",
          balances: { receiver: "1730", issuer: "5110" },
        }, null, 2)
      : "Ready for the local OffCKB chain.",
  );
  const [busy, setBusy] = useState(false);

  const run = async (job: () => Promise<unknown>, label: string) => {
    setBusy(true);
    setNote(`${label}...`);
    try {
      const result = await job();
      setNote(JSON.stringify(result, null, 2));
    } catch (error) {
      setNote(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <header>
        <div>
          <p className="tag">SUEMUNYAO | CAMPAIGN 05</p>
          <h1>Cell Token Desk</h1>
        </div>
        <span className="network"><i /> OffCKB devnet</span>
      </header>

      <section className="intro">
        <strong>xUDT follows the cell.</strong>
        <span>Issue a balance, find it by the issuer lock hash, then give part of it a new lock.</span>
      </section>

      <div className="steps">
        <article>
          <b>01</b>
          <h2>Issue</h2>
          <label>Issuer private key</label>
          <input type="password" placeholder="0x..." value={key} onChange={(e) => setKey(e.target.value)} />
          <label>Token amount</label>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <div className="actions">
            <button disabled={busy || !validKey(key)} onClick={() => run(() => readWallet(key as Hex), "Reading wallet")}>Check</button>
            <button disabled={busy || !validKey(key) || Number(qty) <= 0} onClick={() => run(async () => {
              const result = await makeCoin(key as Hex, qty);
              setOwnerHash(result.ownerHash);
              return result;
            }, "Issuing token")}>Issue</button>
          </div>
        </article>

        <article>
          <b>02</b>
          <h2>Find</h2>
          <label>Issuer lock hash</label>
          <textarea placeholder="0x..." value={ownerHash} onChange={(e) => setOwnerHash(e.target.value)} />
          <p className="hint">The lock hash identifies this token inside the xUDT args.</p>
          <button disabled={busy || !validHash(ownerHash)} onClick={() => run(() => scanCoin(ownerHash as Hex), "Finding cells")}>Find cells</button>
        </article>

        <article>
          <b>03</b>
          <h2>Transfer</h2>
          <label>Receiver address</label>
          <textarea className="address" placeholder="ckt1..." value={to} onChange={(e) => setTo(e.target.value)} />
          <label>Token amount</label>
          <input type="number" value={sendQty} onChange={(e) => setSendQty(e.target.value)} />
          <button disabled={busy || !validKey(key) || !validHash(ownerHash) || !to || Number(sendQty) <= 0} onClick={() => run(() => moveCoin(key as Hex, ownerHash as Hex, sendQty, to), "Transferring token")}>Transfer</button>
        </article>
      </div>

      <section className="console">
        <span>LOCAL RESULT</span>
        <pre>{note}</pre>
      </section>
    </main>
  );
}

const host = document.getElementById("desk");
if (!host) throw new Error("Missing app mount point");
createRoot(host).render(<App />);
