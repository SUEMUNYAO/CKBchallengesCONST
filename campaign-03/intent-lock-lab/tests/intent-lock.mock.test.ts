import {
  Script,
  Transaction,
  WitnessArgs,
  hashCkb,
  hashTypeToBytes,
  hexFrom,
} from "@ckb-ccc/core";
import { readFileSync } from "fs";
import {
  DEFAULT_SCRIPT_ALWAYS_SUCCESS,
  DEFAULT_SCRIPT_CKB_JS_VM,
  Resource,
  Verifier,
} from "ckb-testtool";

const VALID_PREIMAGE = "paper cranes cross midnight";
const WRONG_PREIMAGE = "paper cranes cross midday";

function utf8Hex(value: string) {
  return hexFrom(new TextEncoder().encode(value));
}

function scriptHash(script: Script) {
  return hashCkb(script.toBytes());
}

function buildTransaction(options?: {
  witness?: string;
  malformedArgs?: boolean;
  wrongRecipient?: boolean;
}) {
  const resource = Resource.default();
  const tx = Transaction.default();

  const ckbJsVm = resource.deployCell(
    hexFrom(readFileSync(DEFAULT_SCRIPT_CKB_JS_VM)),
    tx,
    false,
  );
  const recipient = resource.deployCell(
    hexFrom(readFileSync(DEFAULT_SCRIPT_ALWAYS_SUCCESS)),
    tx,
    false,
  );
  const contract = resource.deployCell(
    hexFrom(readFileSync("dist/intent-lock.bc")),
    tx,
    false,
  );

  const customArgs = options?.malformedArgs
    ? hashCkb(utf8Hex(VALID_PREIMAGE)).slice(2)
    : hashCkb(utf8Hex(VALID_PREIMAGE)).slice(2) +
      scriptHash(recipient).slice(2);

  ckbJsVm.args = hexFrom(
    "0x0000" +
      contract.codeHash.slice(2) +
      hexFrom(hashTypeToBytes(contract.hashType)).slice(2) +
      customArgs,
  );

  const input = resource.mockCell(ckbJsVm, undefined, "0x");
  tx.inputs.push(Resource.createCellInput(input));
  tx.outputs.push(
    Resource.createCellOutput(options?.wrongRecipient ? contract : recipient),
  );
  tx.outputsData.push(hexFrom("0x"));

  if (options?.witness !== undefined) {
    tx.witnesses.push(
      hexFrom(new WitnessArgs(utf8Hex(options.witness)).toBytes()),
    );
  }

  return { resource, tx };
}

async function expectExitCode(verifier: Verifier, expectedCode: number) {
  const results = await verifier.verify();
  for (const result of results) result.reportSummary();
  expect(
    results.some((result) => result.scriptErrorCode === expectedCode),
  ).toBe(true);
}

describe("intent-lock contract", () => {
  test("accepts the committed preimage and recipient", async () => {
    const { resource, tx } = buildTransaction({ witness: VALID_PREIMAGE });
    await expectExitCode(Verifier.from(resource, tx), 0);
  });

  test("rejects a different preimage with exit code 11", () => {
    const { resource, tx } = buildTransaction({ witness: WRONG_PREIMAGE });
    expectExitCode(Verifier.from(resource, tx), 11);
  });

  test("rejects an empty witness with exit code 10", () => {
    const { resource, tx } = buildTransaction({ witness: "" });
    expectExitCode(Verifier.from(resource, tx), 10);
  });

  test("rejects malformed arguments with exit code 12", () => {
    const { resource, tx } = buildTransaction({
      witness: VALID_PREIMAGE,
      malformedArgs: true,
    });
    expectExitCode(Verifier.from(resource, tx), 12);
  });

  test("rejects a redirected output with exit code 13", () => {
    const { resource, tx } = buildTransaction({
      witness: VALID_PREIMAGE,
      wrongRecipient: true,
    });
    expectExitCode(Verifier.from(resource, tx), 13);
  });
});
