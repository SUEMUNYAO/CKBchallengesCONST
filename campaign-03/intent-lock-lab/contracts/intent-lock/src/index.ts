import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, bytesEq, hashCkb, log } from "@ckb-js-std/core";

const ERROR_WITNESS_MISSING = 10;
const ERROR_PREIMAGE_MISMATCH = 11;
const ERROR_ARGS_MALFORMED = 12;
const ERROR_RECIPIENT_MISMATCH = 13;

const CKB_JS_VM_PREFIX_BYTES = 35;
const HASH_BYTES = 32;
const CUSTOM_ARGS_BYTES = HASH_BYTES * 2;

function main(): number {
  log.setLevel(log.LogLevel.Debug);

  const args = new Uint8Array(HighLevel.loadScript().args);
  if (args.length !== CKB_JS_VM_PREFIX_BYTES + CUSTOM_ARGS_BYTES) {
    log.error(`Expected 99 argument bytes, received ${args.length}`);
    return ERROR_ARGS_MALFORMED;
  }

  const expectedPreimageHash = args.slice(
    CKB_JS_VM_PREFIX_BYTES,
    CKB_JS_VM_PREFIX_BYTES + HASH_BYTES,
  );
  const expectedRecipientLockHash = args.slice(
    CKB_JS_VM_PREFIX_BYTES + HASH_BYTES,
  );

  let preimage: ArrayBuffer | undefined;
  try {
    preimage = HighLevel.loadWitnessArgs(
      0,
      bindings.SOURCE_GROUP_INPUT,
    ).lock;
  } catch (_error) {
    log.error("The first group-input witness is missing");
    return ERROR_WITNESS_MISSING;
  }

  if (!preimage || preimage.byteLength === 0) {
    log.error("The witness lock field must contain a preimage");
    return ERROR_WITNESS_MISSING;
  }

  if (!bytesEq(hashCkb(preimage), expectedPreimageHash.buffer)) {
    log.error("The witness preimage does not match the committed hash");
    return ERROR_PREIMAGE_MISMATCH;
  }

  let recipientLockHash: ArrayBuffer;
  try {
    recipientLockHash = HighLevel.loadCellLockHash(
      0,
      bindings.SOURCE_OUTPUT,
    );
  } catch (_error) {
    log.error("The intended recipient output is missing");
    return ERROR_RECIPIENT_MISMATCH;
  }

  if (!bytesEq(recipientLockHash, expectedRecipientLockHash.buffer)) {
    log.error("Output zero does not use the committed recipient lock");
    return ERROR_RECIPIENT_MISMATCH;
  }

  log.debug("Preimage and recipient accepted");
  return 0;
}

bindings.exit(main());
