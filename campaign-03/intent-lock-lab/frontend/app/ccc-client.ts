import { ccc, CellDepInfoLike, KnownScript, Script } from "@ckb-ccc/core";
import systemScripts from "../../deployment/system-scripts.json";

type ScriptInfo = Pick<Script, "codeHash" | "hashType"> & {
  cellDeps: CellDepInfoLike[];
};

const devnet = systemScripts.devnet;

export const DEVNET_SCRIPTS: Record<string, ScriptInfo> = {
  [KnownScript.Secp256k1Blake160]: devnet.secp256k1_blake160_sighash_all!
    .script as ScriptInfo,
  [KnownScript.Secp256k1Multisig]: devnet.secp256k1_blake160_multisig_all!
    .script as ScriptInfo,
  [KnownScript.AnyoneCanPay]: devnet.anyone_can_pay!.script as ScriptInfo,
  [KnownScript.OmniLock]: devnet.omnilock!.script as ScriptInfo,
  [KnownScript.XUdt]: devnet.xudt!.script as ScriptInfo,
  [KnownScript.NervosDao]: devnet.dao!.script as ScriptInfo,
};

export const cccClient = new ccc.ClientPublicTestnet({
  url: process.env.NEXT_PUBLIC_CKB_RPC_URL ?? "http://127.0.0.1:28114",
  scripts: DEVNET_SCRIPTS as any,
});
