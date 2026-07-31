"use client";

import {
  Activity,
  Check,
  Copy,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Intent,
  Limits,
  deriveIntent,
  formatCkb,
  getDeployment,
  getLimits,
  parseCkb,
  readCapacity,
  readTip,
  unlock,
  waitForCommit,
} from "./intent-lock";

const PREIMAGE = "paper cranes cross midnight";
const WRONG_PREIMAGE = "paper cranes cross midday";
const RECIPIENT =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8";

type Attempt = "idle" | "submitting" | "rejected" | "committed";
type WitnessMode = "incorrect" | "correct" | "custom";
type Transfer = { input: bigint; sent: bigint; change: bigint; fee: bigint };

function compact(value: string, head = 14, tail = 12) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function messageFrom(error: unknown) {
  const value = error instanceof Error ? error.message : String(error);
  if (value.includes("error code 11") || value.includes("ValidationFailure")) {
    return "Rejected: preimage mismatch (exit code 11)";
  }
  if (value.includes("error code 13")) {
    return "Rejected: recipient mismatch (exit code 13)";
  }
  return value.replace(/^Error:\s*/, "").split("\n")[0];
}

export default function Home() {
  const [preimage, setPreimage] = useState(PREIMAGE);
  const [recipient, setRecipient] = useState(RECIPIENT);
  const [intent, setIntent] = useState<Intent>();
  const [capacity, setCapacity] = useState(0n);
  const [tip, setTip] = useState("-");
  const [limits, setLimits] = useState<Limits>();
  const [amount, setAmount] = useState("120");
  const [witness, setWitness] = useState(WRONG_PREIMAGE);
  const [witnessMode, setWitnessMode] = useState<WitnessMode>("incorrect");
  const [attempt, setAttempt] = useState<Attempt>("idle");
  const [status, setStatus] = useState("Ready");
  const [online, setOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [lastTransfer, setLastTransfer] = useState<Transfer>();

  const amountValue = useMemo(() => {
    try {
      return parseCkb(amount);
    } catch {
      return -1n;
    }
  }, [amount]);

  useEffect(() => {
    let active = true;
    void deriveIntent(preimage, recipient)
      .then((value) => {
        if (active) setIntent(value);
      })
      .catch((error) => {
        if (active) {
          setIntent(undefined);
          setStatus(messageFrom(error));
        }
      });
    return () => {
      active = false;
    };
  }, [preimage, recipient]);

  const refresh = useCallback(async () => {
    if (!intent) return;
    setRefreshing(true);
    try {
      const [nextCapacity, nextTip] = await Promise.all([
        readCapacity(intent),
        readTip(),
      ]);
      setCapacity(nextCapacity);
      setTip(nextTip.toString());
      setLimits(await getLimits(intent, recipient, nextCapacity));
      setOnline(true);
    } catch (error) {
      setOnline(false);
      setStatus(messageFrom(error));
    } finally {
      setRefreshing(false);
    }
  }, [intent, recipient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function chooseWitness(mode: WitnessMode) {
    setWitnessMode(mode);
    if (mode === "incorrect") setWitness(WRONG_PREIMAGE);
    if (mode === "correct") setWitness(preimage);
  }

  async function copyDeposit() {
    if (!intent) return;
    await navigator.clipboard.writeText(
      `offckb deposit --network devnet ${intent.address} 360`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function submit() {
    if (!intent) return;
    setAttempt("submitting");
    setStatus("Submitting witness");
    setTxHash("");
    try {
      const result = await unlock(intent, recipient, amount, witness);
      setLastTransfer({
        input: result.inputCapacity,
        sent: result.transfer,
        change: result.change,
        fee: result.fee,
      });
      setTxHash(result.txHash);
      setStatus("Waiting for commitment");
      await waitForCommit(result.txHash);
      setAttempt("committed");
      setStatus("Committed");
      await refresh();
    } catch (error) {
      setAttempt("rejected");
      setStatus(messageFrom(error));
      await refresh();
    }
  }

  const depositCommand = intent
    ? `offckb deposit --network devnet ${intent.address} 360`
    : "Intent address unavailable";
  const canSubmit =
    Boolean(intent) &&
    Boolean(limits) &&
    capacity > 0n &&
    witness.length > 0 &&
    amountValue >= (limits?.recipientMinimum ?? 0n) &&
    amountValue <= (limits?.maximum ?? -1n) &&
    attempt !== "submitting";

  return (
    <main className="shell">
      <header className="topbar">
        <div className="identity">
          <span className="campaign">03</span>
          <div>
            <p className="kicker">OFFCKB DEVNET</p>
            <h1>Intent Lock Console</h1>
          </div>
        </div>
        <div className="runtime">
          <span className={online ? "status ok" : "status error"}>
            <Activity size={14} /> RPC {online ? "online" : "offline"}
          </span>
          <span className={getDeployment() ? "status ok" : "status error"}>
            <ShieldCheck size={14} /> Contract {getDeployment() ? "loaded" : "missing"}
          </span>
          <span className="tip">TIP {tip}</span>
        </div>
      </header>

      <section className="deployment">
        <div>
          <span>CONTRACT</span>
          <strong>INTENT-LOCK.BC</strong>
        </div>
        <div>
          <span>CODE HASH</span>
          <code>{getDeployment()?.codeHash ?? "Unavailable"}</code>
        </div>
      </section>

      <section className="console-grid">
        <article className="column">
          <header className="column-title">
            <span>01</span>
            <div><p>COMMIT</p><h2>Lock intent</h2></div>
          </header>
          <label htmlFor="preimage">Preimage</label>
          <input
            id="preimage"
            value={preimage}
            onChange={(event) => {
              setPreimage(event.target.value);
              if (witnessMode === "correct") setWitness(event.target.value);
            }}
          />
          <label htmlFor="recipient">Committed recipient</label>
          <textarea
            id="recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            rows={4}
          />
          <div className="datum">
            <span>PREIMAGE HASH</span>
            <code>{intent?.preimageHash ?? "Pending"}</code>
          </div>
          <div className="datum">
            <span>RECIPIENT LOCK HASH</span>
            <code>{intent?.recipientLockHash ?? "Pending"}</code>
          </div>
        </article>

        <article className="column live-column">
          <header className="column-title">
            <span>02</span>
            <div><p>OBSERVE</p><h2>Locked cell</h2></div>
          </header>
          <div className="capacity">
            <strong>{formatCkb(capacity)}</strong><span>CKB</span>
          </div>
          <button
            className="secondary"
            type="button"
            onClick={() => void refresh()}
            disabled={!intent || refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            Refresh state
          </button>
          <div className="datum address">
            <span>INTENT LOCK ADDRESS</span>
            <code>{intent?.address ?? "Pending"}</code>
          </div>
          <div className="command">
            <span>DEPOSIT COMMAND</span>
            <code>{depositCommand}</code>
            <button
              type="button"
              onClick={() => void copyDeposit()}
              disabled={!intent}
              aria-label="Copy deposit command"
              title="Copy deposit command"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </article>

        <article className="column">
          <header className="column-title">
            <span>03</span>
            <div><p>AUTHORIZE</p><h2>Witness spend</h2></div>
          </header>
          <label htmlFor="amount">Recipient capacity</label>
          <div className="amount">
            <input
              id="amount"
              type="number"
              step="0.00001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <span>CKB</span>
          </div>
          <div className="limits">
            <span>
              MAX {limits ? formatCkb(limits.maximum) : "-"} CKB
            </span>
            <span>
              CHANGE FLOOR {limits ? formatCkb(limits.changeMinimum) : "-"} CKB
            </span>
          </div>
          <div className="segmented" aria-label="Witness choice">
            {(["incorrect", "correct", "custom"] as WitnessMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={witnessMode === mode ? "active" : ""}
                onClick={() => chooseWitness(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <label htmlFor="witness">Witness lock</label>
          <input
            id="witness"
            value={witness}
            onChange={(event) => {
              setWitness(event.target.value);
              setWitnessMode("custom");
            }}
          />
          <button
            className="primary"
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
          >
            <Send size={16} /> Submit witness
          </button>
        </article>
      </section>

      <section className="trace">
        <header>
          <div><p className="kicker">TRANSACTION RESULT</p><h2>Cell transition</h2></div>
          <span className={`attempt ${attempt}`}>
            {attempt === "rejected" ? <X size={14} /> : <Activity size={14} />}
            {status}
          </span>
        </header>
        <div className="trace-grid">
          <div><span>INPUT</span><strong>{lastTransfer ? formatCkb(lastTransfer.input) : formatCkb(capacity)} CKB</strong></div>
          <div><span>WITNESS</span><strong>{witnessMode}</strong></div>
          <div><span>RECIPIENT</span><strong>{lastTransfer ? `${formatCkb(lastTransfer.sent)} CKB` : compact(recipient)}</strong></div>
          <div><span>CHANGE</span><strong>{lastTransfer ? `${formatCkb(lastTransfer.change)} CKB` : "-"}</strong></div>
          <div><span>FEE</span><strong>{lastTransfer ? `${formatCkb(lastTransfer.fee)} CKB` : "0.00001 CKB"}</strong></div>
        </div>
        <div className="tx-row">
          <span>TRANSACTION</span>
          <code>{txHash || "No committed transaction in this session"}</code>
        </div>
      </section>
    </main>
  );
}
