#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildEmmcStateImage,
  readEmmcStateInputs,
} from "../src/qemu/omi-emmc-image.js";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const outImage = resolve(argValue("--out", "dist/omi-emmc-state.img"));
const outLayout = resolve(argValue("--layout", "dist/omi-emmc-layout.json"));
const outReceipt = resolve(argValue("--receipt", "dist/omi-emmc-receipt.json"));

const inputs = await readEmmcStateInputs();
const state = await buildEmmcStateImage(inputs);

await mkdir(dirname(outImage), { recursive: true });
await mkdir(dirname(outLayout), { recursive: true });
await mkdir(dirname(outReceipt), { recursive: true });

await writeFile(outImage, state.image);
await writeFile(outLayout, `${JSON.stringify({
  layout: state.layout,
  planes: state.planeRecords,
  vectorBundle: state.vectorBundle,
}, null, 2)}\n`);
await writeFile(outReceipt, `${JSON.stringify(state.receipt, null, 2)}\n`);

console.log(`[omi-emmc] image:   ${outImage}`);
console.log(`[omi-emmc] layout:  ${outLayout}`);
console.log(`[omi-emmc] receipt: ${outReceipt}`);
console.log(`[omi-emmc] bytes:   ${state.image.byteLength}`);
