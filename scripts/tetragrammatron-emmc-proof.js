#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createEmmcLayout } from "../src/qemu/omi-emmc-layout.js";
import { verifyEmmcStateImage } from "../src/qemu/omi-emmc-image.js";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const imagePath = resolve(argValue("--image", "dist/omi-emmc-state.img"));
const image = await readFile(imagePath);
const layout = createEmmcLayout();
const proof = verifyEmmcStateImage(image, layout);

if (!proof.accepted) {
  console.error("[omi-emmc-proof] rejected");
  for (const error of proof.errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log("[omi-emmc-proof] accepted");
console.log(`[omi-emmc-proof] image: ${imagePath}`);
console.log(`[omi-emmc-proof] bytes: ${image.byteLength}`);
console.log(`[omi-emmc-proof] receipt: ${proof.parsed.rpmb.receiptHash}`);
console.log(`[omi-emmc-proof] planes: ${proof.parsed.planes.map((plane) => plane.oPlane).join(", ")}`);
