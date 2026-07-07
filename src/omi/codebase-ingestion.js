import { fnv1a32, stableJson } from "../core/deterministic-utils.js";
import {
  emitSlideTelemetry,
  formatSlideTelemetry,
  makeOmiCell,
  stepOmiCell
} from "./autonomous-slide.js";

export const OMI_INGESTION_ROOT_SEGMENT = 0x0c0d;

export const OMI_INGESTION_CATEGORIES = Object.freeze([
  "RULES",
  "FACTS",
  "CLOSURES",
  "COMBINATORS",
  "CONS"
]);

export const CATEGORY_KEYWORDS = Object.freeze({
  RULES: "MUST",
  FACTS: "FACT",
  CLOSURES: "CLOSE",
  COMBINATORS: "COMBINE",
  CONS: "CONS"
});

export const CATEGORY_CODES = Object.freeze({
  RULES: 0x0001,
  FACTS: 0x0002,
  CLOSURES: 0x0003,
  COMBINATORS: 0x0004,
  CONS: 0x0005
});

export const CATEGORY_RINGS = Object.freeze({
  RULES: 2,
  FACTS: 1,
  CLOSURES: 3,
  COMBINATORS: 2,
  CONS: 0
});

export const LANGUAGE_CODES = Object.freeze({
  javascript: 0x0001,
  typescript: 0x0002,
  c: 0x0003,
  cpp: 0x0004,
  python: 0x0005,
  generic: 0x000f
});

export const LANGUAGE_EXTENSIONS = Object.freeze({
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".cts": "typescript",
  ".mts": "typescript",
  ".c": "c",
  ".h": "c",
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".hh": "cpp",
  ".hpp": "cpp",
  ".hxx": "cpp",
  ".py": "python",
  ".pyw": "python"
});

export const DEFAULT_IGNORED_DIRECTORIES = Object.freeze([
  ".git",
  ".hg",
  ".svn",
  ".cache",
  ".next",
  ".nuxt",
  ".vite",
  "coverage",
  "dist",
  "build",
  "node_modules",
  "vendor"
]);

const IDENT = "[A-Za-z_$][\\w$]*";
const JS_NAME_RE = new RegExp(IDENT);
const JS_FUNCTION_RE = new RegExp(
  `^(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?function(?:\\s+\\*)?\\s+(${IDENT})\\s*\\(`
);
const JS_ARROW_RE = new RegExp(
  `^(?:export\\s+)?(?:const|let|var)\\s+(${IDENT})\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|${IDENT})\\s*=>`
);
const JS_FUNCTION_EXPR_RE = new RegExp(
  `^(?:export\\s+)?(?:const|let|var)\\s+(${IDENT})\\s*=\\s*(?:async\\s+)?function(?:\\s+\\*)?(?:\\s+${IDENT})?\\s*\\(`
);
const JS_CLASS_RE = new RegExp(`^(?:export\\s+)?(?:default\\s+)?class\\s+(${IDENT})\\b`);
const JS_INTERFACE_RE = new RegExp(`^(?:export\\s+)?interface\\s+(${IDENT})\\b`);
const JS_TYPE_RE = new RegExp(`^(?:export\\s+)?type\\s+(${IDENT})\\s*=`);
const JS_ENUM_RE = new RegExp(`^(?:export\\s+)?enum\\s+(${IDENT})\\b`);
const JS_VAR_RE = new RegExp(`^(?:export\\s+)?(?:const|let|var)\\s+(${IDENT})\\b`);
const JS_METHOD_RE = new RegExp(`^(?:async\\s+)?(${IDENT})\\s*\\([^)]*\\)\\s*\\{`);
const JS_CONTROL_RE = /^(if|for|while|switch|try|catch|finally)\b/;

const C_FUNCTION_RE = /^([A-Za-z_][\w\s*()[\],]*?\s+)?([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/;
const C_TYPE_RE = /^(typedef|struct|enum|union)\b(?:[^A-Za-z_]+([A-Za-z_]\w*))?/;
const C_DEFINE_RE = /^#\s*define\s+([A-Za-z_]\w*)\b/;
const C_INCLUDE_RE = /^#\s*include\b/;
const C_VAR_RE = /^(?:static\s+)?(?:const\s+)?(?:volatile\s+)?[A-Za-z_][\w\s*]*\s+([A-Za-z_]\w*)\s*(?:=|;)/;
const C_CONTROL_RE = /^(if|for|while|switch|do)\b/;

const PY_DEF_RE = /^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/;
const PY_CLASS_RE = /^class\s+([A-Za-z_]\w*)\b/;
const PY_IMPORT_RE = /^(?:from\s+\S+\s+)?import\s+/;
const PY_ASSIGN_RE = /^([A-Za-z_]\w*)\s*(?::[^=]+)?=/;
const PY_CONTROL_RE = /^(if|elif|else|for|while|try|except|finally|with)\b/;

const GENERIC_ASSIGN_RE = /^([A-Za-z_]\w*)\s*=/;
const GENERIC_CALL_BLOCK_RE = /^([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/;

export function detectLanguage(filePath) {
  const lower = String(filePath || "").toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return "generic";
  return LANGUAGE_EXTENSIONS[lower.slice(dot)] || "generic";
}

export function supportedSourceExtension(filePath) {
  return detectLanguage(filePath) !== "generic";
}

export function defaultShouldIncludePath(filePath, options = {}) {
  const parts = normalizeSourcePath(filePath).split("/");
  const ignored = new Set(options.ignoredDirectories || DEFAULT_IGNORED_DIRECTORIES);
  if (parts.some((part) => ignored.has(part))) return false;
  if (options.extensions) {
    const lower = String(filePath || "").toLowerCase();
    return options.extensions.some((ext) => lower.endsWith(String(ext).toLowerCase()));
  }
  return supportedSourceExtension(filePath);
}

export function scanCodeSource({ path = "inline", content = "", language = detectLanguage(path) } = {}) {
  const sourcePath = normalizeSourcePath(path);
  const lines = String(content || "").split(/\r?\n/);
  const elements = [];

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index];
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed || isCommentLine(trimmed, language)) continue;

    const found = scanLine(trimmed, raw, line, sourcePath, language);
    if (found) elements.push(found);
  }

  return elements.map((element, ordinal) => finalizeElement(element, ordinal));
}

export function ingestSourceFile(source, options = {}) {
  const language = source.language || detectLanguage(source.path);
  const elements = scanCodeSource({ ...source, language });
  return finalizeIngestion(elements, {
    ...options,
    sourceCount: 1,
    sourcePaths: [normalizeSourcePath(source.path || "inline")]
  });
}

export function ingestSources(sources, options = {}) {
  const allElements = [];
  const sourcePaths = [];
  const orderedSources = [...(sources || [])].sort((a, b) => {
    return normalizeSourcePath(a.path).localeCompare(normalizeSourcePath(b.path));
  });

  for (const source of orderedSources) {
    sourcePaths.push(normalizeSourcePath(source.path || "inline"));
    const language = source.language || detectLanguage(source.path);
    allElements.push(...scanCodeSource({ ...source, language }));
  }

  return finalizeIngestion(allElements, {
    ...options,
    sourceCount: orderedSources.length,
    sourcePaths
  });
}

export function buildOmiDocuments(ingestion) {
  const records = Array.isArray(ingestion) ? ingestion : ingestion.records || [];
  const grouped = groupRecordsByCategory(records);
  const documents = {};

  for (const category of OMI_INGESTION_CATEGORIES) {
    documents[`${category}.omi`] = formatOmiDocument(category, grouped[category] || []);
  }

  return documents;
}

export function groupRecordsByCategory(records) {
  const grouped = Object.fromEntries(OMI_INGESTION_CATEGORIES.map((category) => [category, []]));
  for (const record of records || []) {
    if (!grouped[record.category]) grouped[record.category] = [];
    grouped[record.category].push(record);
  }
  for (const rows of Object.values(grouped)) {
    rows.sort((a, b) => {
      if (a.address !== b.address) return a.address.localeCompare(b.address);
      return a.id.localeCompare(b.id);
    });
  }
  return grouped;
}

export function formatOmiDocument(category, records) {
  const keyword = CATEGORY_KEYWORDS[category] || "FACT";
  const header = [
    "# ============================================================================",
    `# OMI CODEBASE INGESTION - ${category}`,
    "# Generated bridge-layer projection. Source code remains authoritative.",
    "# ============================================================================"
  ];
  const body = (records || []).map((record) => formatOmiRecord(record, keyword));
  return `${header.concat(body).join("\n\n")}\n`;
}

export function formatOmiRecord(record, keyword = CATEGORY_KEYWORDS[record.category] || "FACT") {
  const lines = [
    `${record.address}/128 ${keyword} ${record.assignment}`,
    `SOURCE: ${record.sourcePath}:${record.line}`,
    `LANGUAGE: ${record.language}`,
    `KIND: ${record.kind}`,
    `SIGNATURE: ${record.signature}`,
    `FRAME: o---o@b_n@z XOR ${record.bitArrayLabel} XOR ${record.receiptLabel}`,
    `CELL: slot=${record.cell.slot} port=${record.cell.port} pipe=${record.cell.pipe} ring=${record.cell.ring} delta=0x${hex32(record.cell.delta)}`,
    `RECEIPT: ${record.telemetry}`
  ];
  return lines.join("\n");
}

export function composeOmiAddressForElement(element) {
  const languageCode = LANGUAGE_CODES[element.language] || LANGUAGE_CODES.generic;
  const categoryCode = CATEGORY_CODES[element.category] || 0x0000;
  const seed = stableJson({
    category: element.category,
    kind: element.kind,
    language: element.language,
    line: element.line,
    name: element.name,
    ordinal: element.ordinal,
    signature: element.signature,
    sourcePath: element.sourcePath
  });
  const hA = fnv1a32(`A:${seed}`);
  const hB = fnv1a32(`B:${seed}`);
  return formatOmiAddressFromSegments([
    OMI_INGESTION_ROOT_SEGMENT,
    languageCode,
    categoryCode,
    element.line & 0xffff,
    (hA >>> 16) & 0xffff,
    hA & 0xffff,
    (hB >>> 16) & 0xffff,
    hB & 0xffff
  ]);
}

export function formatOmiAddressFromSegments(segments) {
  if (!Array.isArray(segments) || segments.length !== 8) {
    throw new TypeError("OMI ingestion addresses require exactly eight 16-bit segments");
  }
  return `omi-${segments.map(hex16).join("-")}`;
}

export function parseOmiAddressSegments(address) {
  const body = String(address || "").replace(/^omi-/, "").split("/")[0];
  const segments = body.split("-").map((part) => parseInt(part, 16));
  if (segments.length !== 8 || segments.some((part) => !Number.isInteger(part) || part < 0 || part > 0xffff)) {
    throw new TypeError(`Invalid OMI ingestion address: ${address}`);
  }
  return segments;
}

export function segmentWordsToPairWords(segments) {
  if (!Array.isArray(segments) || segments.length !== 8) {
    throw new TypeError("Pair words require eight 16-bit segments");
  }
  const words = [];
  for (let i = 0; i < 8; i += 2) {
    words.push((((segments[i] & 0xffff) << 16) | (segments[i + 1] & 0xffff)) >>> 0);
  }
  return words;
}

export function addressToPairWords(address) {
  return segmentWordsToPairWords(parseOmiAddressSegments(address));
}

export function initializeCellForRecord(record, oldWord = 0) {
  const [rt, lambda, beta, omega] = addressToPairWords(record.address);
  const cell = makeOmiCell(
    record.ordinal,
    CATEGORY_CODES[record.category] || 0,
    LANGUAGE_CODES[record.language] || LANGUAGE_CODES.generic,
    CATEGORY_RINGS[record.category] ?? 0,
    oldWord
  );
  const stepped = stepOmiCell(cell, rt, lambda, beta, omega);
  return {
    cell: stepped,
    pairWords: { rt, lambda, beta, omega },
    telemetry: emitSlideTelemetry(stepped) || formatSlideTelemetry(stepped)
  };
}

export function cellStateKeyForRecord(record) {
  return String(record?.address || record?.id || "");
}

export function previousCellWordForRecord(record, previousCellState = null) {
  if (!previousCellState) return 0;
  const key = cellStateKeyForRecord(record);
  const value =
    previousCellState instanceof Map
      ? previousCellState.get(key)
      : previousCellState[key] ?? previousCellState.cells?.[key];
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value >>> 0;
  if (typeof value === "bigint") return Number(value & 0xffffffffn) >>> 0;
  if (typeof value === "object") {
    if (typeof value.newWord === "number") return value.newWord >>> 0;
    if (typeof value.oldWord === "number") return value.oldWord >>> 0;
    if (typeof value.word === "number") return value.word >>> 0;
    if (typeof value.cell?.newWord === "number") return value.cell.newWord >>> 0;
  }
  return 0;
}

export function buildCellState(records = []) {
  const cells = {};
  for (const record of records || []) {
    const key = cellStateKeyForRecord(record);
    if (!key) continue;
    cells[key] = {
      address: record.address,
      id: record.id,
      newWord: record.cell?.newWord >>> 0,
      oldWord: record.cell?.oldWord >>> 0,
      delta: record.cell?.delta >>> 0,
      surrogate: record.cell?.surrogate >>> 0,
      suboptimal: record.cell?.suboptimal >>> 0
    };
  }
  return Object.freeze(cells);
}

function finalizeIngestion(elements, options) {
  const records = elements
    .map((element, ordinal) => finalizeElement({ ...element, ordinal }, ordinal))
    .map((element) => {
      const address = composeOmiAddressForElement(element);
      const record = {
        ...element,
        address,
        assignment: makeAssignment(element),
        bitArrayLabel: `{${addressToPairWords(address).map((word) => `0x${hex32(word)}`).join(",")}}`,
        receiptLabel: `omi-@b_${element.ordinal}-@z-imo`
      };
      const { cell, pairWords, telemetry } = initializeCellForRecord(
        record,
        previousCellWordForRecord(record, options.previousCellState ?? options.previousCells)
      );
      return {
        ...record,
        cell,
        pairWords,
        telemetry
      };
    });

  const grouped = groupRecordsByCategory(records);
  const summary = {
    sourceCount: options.sourceCount || 0,
    sourcePaths: options.sourcePaths || [],
    recordCount: records.length,
    categories: Object.fromEntries(
      OMI_INGESTION_CATEGORIES.map((category) => [category, (grouped[category] || []).length])
    ),
    holes: records.filter((record) => record.cell.suboptimal === 1).length,
    surrogateCarry: records.filter((record) => record.cell.surrogate === 1).length,
    stable: records.filter((record) => record.cell.delta === 0).length
  };

  return {
    records,
    grouped,
    summary,
    receipts: records.map((record) => record.telemetry),
    documents: buildOmiDocuments(records)
  };
}

function scanLine(trimmed, raw, line, sourcePath, language) {
  if (language === "javascript" || language === "typescript") {
    return scanJavaScriptLine(trimmed, raw, line, sourcePath, language);
  }
  if (language === "c" || language === "cpp") {
    return scanCLine(trimmed, raw, line, sourcePath, language);
  }
  if (language === "python") {
    return scanPythonLine(trimmed, raw, line, sourcePath, language);
  }
  return scanGenericLine(trimmed, raw, line, sourcePath, language);
}

function scanJavaScriptLine(trimmed, raw, line, sourcePath, language) {
  const functionMatch = trimmed.match(JS_FUNCTION_RE);
  if (functionMatch) return makeElement("COMBINATORS", "function", functionMatch[1], trimmed, raw, line, sourcePath, language);

  const arrowMatch = trimmed.match(JS_ARROW_RE);
  if (arrowMatch) return makeElement("COMBINATORS", "arrow-function", arrowMatch[1], trimmed, raw, line, sourcePath, language);

  const functionExprMatch = trimmed.match(JS_FUNCTION_EXPR_RE);
  if (functionExprMatch) return makeElement("COMBINATORS", "function-expression", functionExprMatch[1], trimmed, raw, line, sourcePath, language);

  const classMatch = trimmed.match(JS_CLASS_RE);
  if (classMatch) return makeElement("CLOSURES", "class", classMatch[1], trimmed, raw, line, sourcePath, language);

  const interfaceMatch = trimmed.match(JS_INTERFACE_RE);
  if (interfaceMatch) return makeElement("RULES", "interface", interfaceMatch[1], trimmed, raw, line, sourcePath, language);

  const typeMatch = trimmed.match(JS_TYPE_RE);
  if (typeMatch) return makeElement("RULES", "type", typeMatch[1], trimmed, raw, line, sourcePath, language);

  const enumMatch = trimmed.match(JS_ENUM_RE);
  if (enumMatch) return makeElement("RULES", "enum", enumMatch[1], trimmed, raw, line, sourcePath, language);

  if (/^import\s+/.test(trimmed) || /^export\s+(?:\{|\*)/.test(trimmed)) {
    return makeElement("FACTS", "module-edge", nameFromModuleLine(trimmed), trimmed, raw, line, sourcePath, language);
  }

  if (/^(assert|expect)\s*\(/.test(trimmed)) {
    return makeElement("FACTS", "assertion", `assertion-${line}`, trimmed, raw, line, sourcePath, language);
  }

  if (JS_CONTROL_RE.test(trimmed)) {
    return makeElement("CLOSURES", "control-scope", `${trimmed.split(/\s|\(/)[0]}-${line}`, trimmed, raw, line, sourcePath, language);
  }

  const methodMatch = trimmed.match(JS_METHOD_RE);
  if (methodMatch && !JS_CONTROL_RE.test(trimmed) && JS_NAME_RE.test(methodMatch[1])) {
    return makeElement("COMBINATORS", "method", methodMatch[1], trimmed, raw, line, sourcePath, language);
  }

  const varMatch = trimmed.match(JS_VAR_RE);
  if (varMatch) return makeElement("CONS", "binding", varMatch[1], trimmed, raw, line, sourcePath, language);

  return null;
}

function scanCLine(trimmed, raw, line, sourcePath, language) {
  const defineMatch = trimmed.match(C_DEFINE_RE);
  if (defineMatch) return makeElement("RULES", "macro", defineMatch[1], trimmed, raw, line, sourcePath, language);

  if (C_INCLUDE_RE.test(trimmed)) {
    return makeElement("FACTS", "include-edge", nameFromModuleLine(trimmed), trimmed, raw, line, sourcePath, language);
  }

  const typeMatch = trimmed.match(C_TYPE_RE);
  if (typeMatch) {
    const name = typeMatch[2] || `${typeMatch[1]}-${line}`;
    return makeElement("RULES", typeMatch[1], name, trimmed, raw, line, sourcePath, language);
  }

  if (C_CONTROL_RE.test(trimmed)) {
    return makeElement("CLOSURES", "control-scope", `${trimmed.split(/\s|\(/)[0]}-${line}`, trimmed, raw, line, sourcePath, language);
  }

  const functionMatch = trimmed.match(C_FUNCTION_RE);
  if (functionMatch && !isCControlName(functionMatch[2])) {
    return makeElement("COMBINATORS", "function", functionMatch[2], trimmed, raw, line, sourcePath, language);
  }

  if (/^assert\s*\(/.test(trimmed)) {
    return makeElement("FACTS", "assertion", `assertion-${line}`, trimmed, raw, line, sourcePath, language);
  }

  const varMatch = trimmed.match(C_VAR_RE);
  if (varMatch) return makeElement("CONS", "binding", varMatch[1], trimmed, raw, line, sourcePath, language);

  return null;
}

function scanPythonLine(trimmed, raw, line, sourcePath, language) {
  const defMatch = trimmed.match(PY_DEF_RE);
  if (defMatch) return makeElement("COMBINATORS", "function", defMatch[1], trimmed, raw, line, sourcePath, language);

  const classMatch = trimmed.match(PY_CLASS_RE);
  if (classMatch) return makeElement("CLOSURES", "class", classMatch[1], trimmed, raw, line, sourcePath, language);

  if (PY_IMPORT_RE.test(trimmed)) {
    return makeElement("FACTS", "module-edge", nameFromModuleLine(trimmed), trimmed, raw, line, sourcePath, language);
  }

  if (/^assert\b/.test(trimmed)) {
    return makeElement("FACTS", "assertion", `assertion-${line}`, trimmed, raw, line, sourcePath, language);
  }

  if (PY_CONTROL_RE.test(trimmed)) {
    return makeElement("CLOSURES", "control-scope", `${trimmed.split(/\s|:/)[0]}-${line}`, trimmed, raw, line, sourcePath, language);
  }

  const assignMatch = trimmed.match(PY_ASSIGN_RE);
  if (assignMatch) return makeElement("CONS", "binding", assignMatch[1], trimmed, raw, line, sourcePath, language);

  return null;
}

function scanGenericLine(trimmed, raw, line, sourcePath, language) {
  const blockMatch = trimmed.match(GENERIC_CALL_BLOCK_RE);
  if (blockMatch) return makeElement("COMBINATORS", "block-call", blockMatch[1], trimmed, raw, line, sourcePath, language);

  const assignMatch = trimmed.match(GENERIC_ASSIGN_RE);
  if (assignMatch) return makeElement("CONS", "binding", assignMatch[1], trimmed, raw, line, sourcePath, language);

  return null;
}

function makeElement(category, kind, name, signature, raw, line, sourcePath, language) {
  return {
    category,
    kind,
    name: String(name || `${kind}-${line}`),
    signature: signature.slice(0, 240),
    sourcePath,
    language,
    line,
    column: Math.max(1, raw.indexOf(name) + 1)
  };
}

function finalizeElement(element, ordinal) {
  const normalized = {
    ...element,
    ordinal: Number.isInteger(element.ordinal) ? element.ordinal : ordinal,
    sourcePath: normalizeSourcePath(element.sourcePath || element.path || "inline"),
    language: element.language || detectLanguage(element.sourcePath || element.path),
    category: normalizeCategory(element.category),
    name: String(element.name || `${element.kind || "element"}-${element.line || 0}`),
    line: Number(element.line || 0),
    column: Number(element.column || 1),
    signature: String(element.signature || "").trim()
  };
  normalized.id = makeElementId(normalized);
  normalized.hash32 = fnv1a32(normalized.id);
  return normalized;
}

function makeElementId(element) {
  return [
    element.category,
    element.language,
    element.sourcePath,
    element.line,
    element.column,
    element.kind,
    element.name,
    element.ordinal
  ].join(":");
}

function normalizeCategory(category) {
  const upper = String(category || "FACTS").toUpperCase();
  return OMI_INGESTION_CATEGORIES.includes(upper) ? upper : "FACTS";
}

function makeAssignment(element) {
  return [
    "codebase",
    element.category.toLowerCase(),
    slugify(element.name),
    slugify(element.sourcePath),
    `l${element.line}`
  ].join("-");
}

function nameFromModuleLine(line) {
  const quoted = String(line).match(/["']([^"']+)["']/);
  if (quoted) return quoted[1];
  return slugify(line).slice(0, 64) || "module-edge";
}

function isCommentLine(trimmed, language) {
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return true;
  if (language === "python" && trimmed.startsWith("#")) return true;
  return false;
}

function isCControlName(name) {
  return ["if", "for", "while", "switch", "return", "sizeof"].includes(String(name));
}

export function normalizeSourcePath(filePath) {
  return String(filePath || "inline").replace(/\\/g, "/").replace(/^\.\//, "");
}

export function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (slug || "anon").slice(0, 96);
}

function hex16(value) {
  return (value & 0xffff).toString(16).padStart(4, "0");
}

function hex32(value) {
  return (value >>> 0).toString(16).toUpperCase().padStart(8, "0");
}
