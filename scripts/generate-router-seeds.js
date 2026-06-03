#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateRouterSeedDocuments } from "../src/omilog/router-seeds.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const VECTOR_DIR = join(ROOT, "vectors");
const check = process.argv.includes("--check");
const documents = generateRouterSeedDocuments();

let drift = false;

if (!check) mkdirSync(VECTOR_DIR, { recursive: true });

for (const [file, text] of Object.entries(documents)) {
  const target = join(VECTOR_DIR, file);
  if (check) {
    if (!existsSync(target)) {
      console.error(`Missing generated router seed: vectors/${file}`);
      drift = true;
      continue;
    }
    const current = readFileSync(target, "utf8");
    if (current !== text) {
      console.error(`Generated router seed is out of date: vectors/${file}`);
      drift = true;
    }
    continue;
  }
  writeFileSync(target, text, "utf8");
  console.log(`Wrote vectors/${file}`);
}

if (check) {
  if (drift) {
    console.error("Router seeds are out of date. Run `make generate-router-seeds`.");
    process.exit(1);
  }
  console.log("Router seeds are up to date.");
}
