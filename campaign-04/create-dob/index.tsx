import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  capacityOf,
  generateAccountFromPrivateKey,
  createSporeDOB,
  showSporeContent,
  shannonToCKB,
} from "./lib.ts";
import { hexStringToUint8Array } from "./helper.ts";
import { RawSporeData } from "@spore-sdk/core";
import { Script } from "@ckb-ccc/core";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);

export function App() {
  // default value: first account privkey from offckb
  const [privKey, setPrivKey] = useState(
    "0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6"
  );
  const [fromAddr, setFromAddr] = useState("");
  const [fromLock, setFromLock] = useState<Script>();
  const [balance, setBalance] = useState("0");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<Uint8Array | null>(null);

  const [txHash, setTxHash] = useState<string>();
  const [outputIndex, setOutputIndex] = useState<number>();
  const [rawSporeData, setRawSporeData] = useState<RawSporeData>();
  const [imageURL, setImageURL] = useState<string>();

  useEffect(() => {
    const updateFromInfo = async () => {
      const { lockScript, address } = await generateAccountFromPrivateKey(privKey);
      const capacity = await capacityOf(address);
      setFromAddr(address);
      setFromLock(lockScript);
      setBalance(shannonToCKB(capacity).toString());
    };

    if (privKey) {
      updateFromInfo();
    }
  }, [privKey]);

  const onInputPrivKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const priv = e.target.value;
    const privateKeyRegex = /^0x[0-9a-fA-F]{64}$/;

    const isValid = privateKeyRegex.test(priv);
    if (isValid) {
      setPrivKey(priv);
    } else {
      alert(
        `Invalid private key: must start with 0x and 32 bytes length. Ensure you're using a valid private key from the offckb accounts list.`
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);

      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result;
        if (content && content instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(content);
          setFileContent(uint8Array);
        }
      };

      reader.readAsArrayBuffer(files[0]);
    }
  };

  const handleCreateSpore = async () => {
    if (!fileContent) return;
    const result = await createSporeDOB(privKey, fileContent);
    setTxHash(result.txHash);
    setOutputIndex(result.outputIndex);
  };

  const renderSpore = async () => {
    if (!txHash || outputIndex == null) return;
    const res = await showSporeContent(txHash, outputIndex);
    if (!res) return;
    setRawSporeData(res);

    const buffer = hexStringToUint8Array(res.content.toString().slice(2));
    // @ts-ignore - Uint8Array compatibility with BlobPart
    const blob = new Blob([buffer], { type: res.contentType });
    const url = URL.createObjectURL(blob);
    setImageURL(url);
  };

  const enabled = +balance > 0 && !!fileContent;
  const enabledRead = !!txHash && outputIndex != null;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>🔗 Create On-Chain Digital Objects</h1>
      <p style={{ color: "#666" }}>Campaign 04 — Spore SDK on CKB</p>

      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="private-key">Private Key: </label>
        <input
          id="private-key"
          type="text"
          value={privKey}
          onChange={onInputPrivKey}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace" }}
        />
        <ul>
          <li>CKB Address: {fromAddr}</li>
          <li>
            Current lock script:
            <pre>{JSON.stringify(fromLock, null, 2)}</pre>
          </li>
          <li>Total capacity: {balance} CKB</li>
        </ul>
        <small>Tx fee: 0.001 CKB</small>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h4>Upload DOB Image File</h4>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {selectedFile && (
          <p>File: {selectedFile.name} ({selectedFile.size} bytes)</p>
        )}
      </div>

      <button
        disabled={!enabled}
        onClick={handleCreateSpore}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          cursor: enabled ? "pointer" : "not-allowed",
          backgroundColor: enabled ? "#4CAF50" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "6px",
        }}
      >
        Create DOB
      </button>

      <hr style={{ margin: "1.5rem 0" }} />

      {txHash && (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Transaction Hash:</strong>
          <pre style={{ wordBreak: "break-all" }}>{txHash}</pre>
        </div>
      )}

      <button
        disabled={!enabledRead}
        onClick={renderSpore}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          cursor: enabledRead ? "pointer" : "not-allowed",
          backgroundColor: enabledRead ? "#2196F3" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "6px",
        }}
      >
        Check Spore Content
      </button>

      {rawSporeData && (
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Content Type:</strong> {rawSporeData.contentType}</p>
        </div>
      )}

      {imageURL && (
        <div style={{ marginTop: "1rem" }}>
          <img
            src={imageURL}
            alt="On-chain DOB"
            style={{ maxWidth: "100%", borderRadius: "8px", border: "2px solid #ddd" }}
          />
        </div>
      )}
    </div>
  );
}
