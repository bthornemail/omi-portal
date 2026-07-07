#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { join, relative } from "node:path";
import {
  DEFAULT_IGNORED_DIRECTORIES,
  defaultShouldIncludePath,
  detectLanguage
} from "../src/omi/codebase-ingestion.js";
import { optimizeCodebase } from "../src/omi/tetragrammatron-optimizer.js";

const args = process.argv.slice(2);

if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
  console.error([
    "Usage: node scripts/tetragrammatron-optimize.js <source-dir> [--out=dist/tetragrammatron-optimizer] [--top=50]",
    "       [--test-output=path/to/npm-test-output.txt] [--max-files=N] [--max-bytes=N] [--ext=.js,.ts,.c,.py]"
  ].join("\n"));
  process.exit(args.length < 1 ? 1 : 0);
}

const sourceRoot = args.find((arg) => !arg.startsWith("-"));
const options = parseOptions(args.filter((arg) => arg !== sourceRoot));

if (!sourceRoot || !existsSync(sourceRoot)) {
  console.error(`Error: source directory not found: ${sourceRoot || ""}`);
  process.exit(1);
}

const { included, skipped } = walkCodebase(sourceRoot, options);
const limitedIncluded = options.maxFiles ? included.slice(0, options.maxFiles) : included;
const sources = limitedIncluded.map((filePath) => ({
  path: relative(sourceRoot, filePath).replace(/\\/g, "/"),
  language: detectLanguage(filePath),
  content: readFileSync(filePath, "utf8")
}));
const skippedSources = [
  ...skipped,
  ...included.slice(limitedIncluded.length).map((filePath) => ({
    path: relative(sourceRoot, filePath).replace(/\\/g, "/"),
    reason: "source skipped by --max-files budget"
  }))
];
const testOutput = options.testOutputPath ? readFileSync(options.testOutputPath, "utf8") : "";

const result = optimizeCodebase({
  sources,
  testOutput,
  options: {
    top: options.top,
    skippedSources
  }
});

mkdirSync(options.outDir, { recursive: true });
writeFileSync(join(options.outDir, "summary.json"), `${JSON.stringify(result.summary, null, 2)}\n`, "utf8");
writeFileSync(join(options.outDir, "candidates.json"), `${JSON.stringify(result.candidates, null, 2)}\n`, "utf8");
writeFileSync(join(options.outDir, "events.jsonl"), `${result.events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
writeFileSync(join(options.outDir, "receipts.txt"), `${result.receipts.join("\n")}\n`, "utf8");
writeFileSync(join(options.outDir, "OPTIMIZATION.omi"), result.omiText, "utf8");

console.log("Tetragrammatron optimizer");
console.log(`  sources: ${sources.length}`);
console.log(`  skipped: ${skippedSources.length}`);
console.log(`  candidates: ${result.summary.candidateCount}/${result.summary.discoveredCandidateCount}`);
console.log(`  output: ${options.outDir}`);

function walkCodebase(root, options) {
  const included = [];
  const skipped = [];
  const ignored = new Set(options.ignoredDirectories || DEFAULT_IGNORED_DIRECTORIES);

  function visit(dir) {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const rel = relative(root, fullPath).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = statSync(fullPath);
      if (stat.size > options.maxBytes) {
        skipped.push({ path: rel, reason: "source skipped by --max-bytes budget" });
        continue;
      }
      if (defaultShouldIncludePath(rel, options)) {
        included.push(fullPath);
      } else {
        skipped.push({ path: rel, reason: "unsupported source surface" });
      }
    }
  }

  visit(root);
  return { included, skipped };
}

function parseOptions(rawArgs) {
  const parsed = {
    extensions: null,
    ignoredDirectories: DEFAULT_IGNORED_DIRECTORIES,
    maxBytes: 1024 * 1024,
    maxFiles: null,
    outDir: "dist/tetragrammatron-optimizer",
    testOutputPath: null,
    top: 50
  };

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    const next = rawArgs[i + 1];
    if (arg === "--out" && next) {
      parsed.outDir = next;
      i++;
    } else if (arg.startsWith("--out=")) {
      parsed.outDir = arg.slice("--out=".length);
    } else if (arg === "--test-output" && next) {
      parsed.testOutputPath = next;
      i++;
    } else if (arg.startsWith("--test-output=")) {
      parsed.testOutputPath = arg.slice("--test-output=".length);
    } else if (arg.startsWith("--top=")) {
      parsed.top = parsePositiveInteger(arg.slice("--top=".length), parsed.top);
    } else if (arg === "--top" && next) {
      parsed.top = parsePositiveInteger(next, parsed.top);
      i++;
    } else if (arg.startsWith("--ext=")) {
      parsed.extensions = arg.slice("--ext=".length).split(",").map((ext) => ext.trim()).filter(Boolean);
    } else if (arg.startsWith("--max-files=")) {
      parsed.maxFiles = parsePositiveInteger(arg.slice("--max-files=".length), parsed.maxFiles);
    } else if (arg.startsWith("--max-bytes=")) {
      parsed.maxBytes = parsePositiveInteger(arg.slice("--max-bytes=".length), parsed.maxBytes);
    } else if (arg.startsWith("--ignore=")) {
      parsed.ignoredDirectories = arg.slice("--ignore=".length).split(",").map((part) => part.trim()).filter(Boolean);
    }
  }

  if (parsed.testOutputPath && !existsSync(parsed.testOutputPath)) {
    console.error(`Error: test output file not found: ${parsed.testOutputPath}`);
    process.exit(1);
  }

  return parsed;
}

function parsePositiveInteger(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}
