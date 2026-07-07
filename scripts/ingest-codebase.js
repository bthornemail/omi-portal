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
  buildOmiDocuments,
  defaultShouldIncludePath,
  detectLanguage,
  ingestSources
} from "../src/omi/codebase-ingestion.js";

const args = process.argv.slice(2);

if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
  console.error("Usage: node scripts/ingest-codebase.js <source-dir> [output-dir] [--max-files=N] [--ext=.js,.ts,.c,.py]");
  process.exit(args.length < 1 ? 1 : 0);
}

const sourceRoot = args[0];
const outputDir = args[1] && !args[1].startsWith("--") ? args[1] : "omi-ingestion";
const options = parseOptions(args.slice(args[1] && !args[1].startsWith("--") ? 2 : 1));

if (!existsSync(sourceRoot)) {
  console.error(`Error: source directory not found: ${sourceRoot}`);
  process.exit(1);
}

const sourceFiles = walkSourceFiles(sourceRoot, options);
const limitedFiles = options.maxFiles ? sourceFiles.slice(0, options.maxFiles) : sourceFiles;
const sources = limitedFiles.map((filePath) => ({
  path: relative(sourceRoot, filePath).replace(/\\/g, "/"),
  language: detectLanguage(filePath),
  content: readFileSync(filePath, "utf8")
}));

const ingestion = ingestSources(sources);
const documents = buildOmiDocuments(ingestion);

mkdirSync(outputDir, { recursive: true });
for (const [fileName, text] of Object.entries(documents)) {
  writeFileSync(join(outputDir, fileName), text, "utf8");
}

writeFileSync(join(outputDir, "RECEIPTS.txt"), `${ingestion.receipts.join("\n")}\n`, "utf8");
writeFileSync(join(outputDir, "manifest.json"), `${JSON.stringify(ingestion.summary, null, 2)}\n`, "utf8");

console.log(`Ingested ${ingestion.summary.recordCount} records from ${sources.length} source file(s).`);
for (const [category, count] of Object.entries(ingestion.summary.categories)) {
  console.log(`  ${category}: ${count}`);
}
console.log(`Wrote OMI projection to ${outputDir}`);

function walkSourceFiles(root, options) {
  const files = [];
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
      if (!defaultShouldIncludePath(rel, options)) continue;
      if (statSync(fullPath).size > options.maxBytes) continue;
      files.push(fullPath);
    }
  }

  visit(root);
  return files;
}

function parseOptions(rawArgs) {
  const parsed = {
    extensions: null,
    ignoredDirectories: DEFAULT_IGNORED_DIRECTORIES,
    maxBytes: 1024 * 1024,
    maxFiles: null
  };

  for (const arg of rawArgs) {
    if (arg.startsWith("--ext=")) {
      parsed.extensions = arg.slice("--ext=".length).split(",").map((ext) => ext.trim()).filter(Boolean);
    } else if (arg.startsWith("--max-files=")) {
      const n = Number(arg.slice("--max-files=".length));
      if (Number.isInteger(n) && n > 0) parsed.maxFiles = n;
    } else if (arg.startsWith("--max-bytes=")) {
      const n = Number(arg.slice("--max-bytes=".length));
      if (Number.isInteger(n) && n > 0) parsed.maxBytes = n;
    } else if (arg.startsWith("--ignore=")) {
      parsed.ignoredDirectories = arg.slice("--ignore=".length).split(",").map((part) => part.trim()).filter(Boolean);
    }
  }

  return parsed;
}
