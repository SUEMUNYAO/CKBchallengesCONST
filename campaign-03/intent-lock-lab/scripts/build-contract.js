#!/usr/bin/env node

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

function buildContract(contractName, isDebug = false) {
  if (!contractName) {
    console.error("Usage: node scripts/build-contract.js <contract-name>");
    process.exit(1);
  }

  const source = path.join("contracts", contractName, "src", "index.ts");
  const outputDirectory = "dist";
  const outputJavaScript = path.join(outputDirectory, `${contractName}.js`);
  const outputBytecode = path.join(outputDirectory, `${contractName}.bc`);

  if (!fs.existsSync(source)) {
    console.error(`Contract source not found: ${source}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDirectory, { recursive: true });
  const esbuild = path.join("node_modules", ".bin", "esbuild");
  const ckbJsVm = path.join(
    "node_modules",
    "ckb-testtool",
    "src",
    "unittest",
    "defaultScript",
    "ckb-js-vm",
  );

  console.log(`BUILD contract: ${contractName}`);
  console.log(`SOURCE ${source}`);
  console.log(`MODE ${isDebug ? "debug" : "release"}`);

  try {
    const esbuildArgs = [
      "--platform=neutral",
      "--bundle",
      "--external:@ckb-js-std/bindings",
      "--target=es2022",
      ...(isDebug
        ? ["--sourcemap=external", "--keep-names", "--define:DEBUG=true"]
        : ["--minify"]),
      source,
      `--outfile=${outputJavaScript}`,
    ];
    execFileSync(esbuild, esbuildArgs, { stdio: "pipe" });

    execFileSync(
      "ckb-debugger",
      [
        "--read-file",
        outputJavaScript,
        "--bin",
        ckbJsVm,
        "--",
        "-c",
        outputBytecode,
      ],
      { stdio: "pipe" },
    );

    console.log(`BYTECODE ${outputBytecode}`);
    console.log("BUILD status: passed");
  } catch (error) {
    console.error(`BUILD status: failed (${error.message})`);
    process.exit(1);
  }
}

const isDebug = process.argv.includes("--debug");
const contractName = process.argv.slice(2).find((arg) => arg !== "--debug");
buildContract(contractName, isDebug);
