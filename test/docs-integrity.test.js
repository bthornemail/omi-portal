import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = process.cwd();
const EXCLUDED_PARTS = new Set([
  ".git",
  "node_modules",
  "dist",
  "artifacts",
  "vendor",
  "_temp"
]);

const AUTHORITY_DOCS = [
  "README.md",
  "MANIFESTO.md",
  "DOCTRINE.md",
  "ONTOLOGY.md",
  "POSTULATES.md",
  "AXIOMS.md",
  "DECLARATIONS.md",
  "GLOSSARY.md",
  "OPEN_PORTAL.md",
  "REMOTE_TESTING.md",
  "DOCUMENTATION_SURFACES.md",
  "docs",
  "dev-docs/README.md",
  "dev-docs/AUDIT.md"
];

const PUBLIC_ENTRYPOINTS = [
  "README.md",
  "docs/README.md",
  "GLOSSARY.md",
  "OPEN_PORTAL.md",
  "REMOTE_TESTING.md",
  "DOCUMENTATION_SURFACES.md"
];

const DOCTRINE_CONFLICT_PATTERNS = [
  /\bCIDR is native\b/i,
  /\bprefix creates identity\b/i,
  /\/48 is native scope/i,
  /FACTS\.omi is the rule registry/i,
  /current baseline:\s*973/i,
  /v1\.0\.0-RC1 current/i,
  /170 production modules current/i,
  /\bOMI stores data\b/i,
  /\bprojection validates state\b/i,
  /\bCIDR as address scope\b/i,
  /\bnative OMI-CIDR\b/i,
  /\bAddressing Is Scoped by CIDR\b/i,
  /\bnative (?:OMI )?(?:address|grammar|identity|pointer).*omi-<frame>\/<control>/i,
  /\bslash path belongs to identity\b/i,
  /\bidentity descent\b/i,
  /omi-<seg0>-<seg1>-<seg2>-<seg3>-<seg4>-<seg5>-<seg6>-<seg7>\/<prefix>/
];

const DOCTRINE_CONFLICT_LABEL = [
  /Historical adapter/i,
  /Deprecated compatibility/i,
  /Legacy CIDR/i,
  /Prior release/i,
  /Reference-only/i,
  /Adapter status/i,
  /Canon alignment notice/i,
  /Doctrine alignment notice/i,
  /adapter-era/i,
  /adapter\/historical/i,
  /historical\/adapter/i
];

function isExcluded(path) {
  return path.split(/[\\/]/).some((part) => EXCLUDED_PARTS.has(part));
}

function collectDocs(path) {
  const abs = resolve(ROOT, path);
  if (!existsSync(abs) || isExcluded(path)) return [];
  const stat = statSync(abs);
  if (stat.isDirectory()) {
    return readdirSync(abs).flatMap((name) => collectDocs(`${path}/${name}`));
  }
  return /\.(md|omi|json)$/.test(path) ? [path] : [];
}

function read(path) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

test("canonical documentation has no broken local markdown links", () => {
  const docs = AUTHORITY_DOCS.flatMap(collectDocs);
  const missing = [];
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const doc of docs) {
    const text = read(doc);
    let match;
    while ((match = linkPattern.exec(text)) !== null) {
      const raw = match[1].trim();
      const href = raw.split("#")[0].replace(/^<|>$/g, "");
      if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const target = resolve(ROOT, dirname(doc), href);
      if (!existsSync(target)) missing.push(`${doc} -> ${raw}`);
    }
  }

  assert.deepEqual(missing, []);
});

test("public entrypoints do not publish stale release counters or native CIDR framing", () => {
  const forbidden = [
    /v1\.0\.0-RC1/,
    /973\/973/,
    /973 verified/,
    /170 production modules/,
    /IPv6-CIDR-style 128-bit frame/,
    /Normative OMI-CIDR grammar/,
    /OMI pointer\s+\|\s+128-bit address reference in `omi-\.\.\.\/prefix` form/,
    /\b\d{3,5}\s+passing tests\b/i,
    /verified invariants/i,
    /production modules/i
  ];

  for (const doc of PUBLIC_ENTRYPOINTS) {
    const text = read(doc);
    for (const pattern of forbidden) {
      assert.doesNotMatch(text, pattern, `${doc} contains stale public phrase ${pattern}`);
    }
  }
});

test("README is an entrypoint, not a release ledger", () => {
  const readme = read("README.md");
  assert.match(readme, /README\.md` is the stable entrypoint, not the release ledger/);
  assert.match(readme, /CHANGELOG\.md/);
  assert.match(readme, /RELEASE_NOTES\.md/);
  assert.match(readme, /dev-docs\/AUDIT\.md/);
  assert.doesNotMatch(readme, /\b\d{3,5}\s+passing tests\b/i);
  assert.doesNotMatch(readme, /v\d+\.\d+\.\d+.*current/i);
});

test("native identity is omi---imo and slash path is routed interpretation", () => {
  for (const doc of ["README.md", "GLOSSARY.md", "DOCUMENTATION_SURFACES.md", "docs/omi-native-gauge-consolidated-canon.md"]) {
    const text = read(doc);
    assert.match(text, /omi---imo/, `${doc} must name omi---imo identity`);
    assert.match(text, /routed interpretation|interpretation routing/i, `${doc} must treat slash path as interpretation routing`);
    assert.doesNotMatch(text, /native (?:OMI )?(?:address|grammar|identity|pointer)[\s\S]{0,160}omi-<frame>\/<control>/i);
  }
});

test("doctrine conflict phrases require explicit historical or adapter labels", () => {
  const docs = AUTHORITY_DOCS.flatMap(collectDocs);
  const unlabeled = [];

  for (const doc of docs) {
    const text = read(doc);
    for (const pattern of DOCTRINE_CONFLICT_PATTERNS) {
      let match;
      const globalPattern = new RegExp(pattern.source, `${pattern.flags.includes("i") ? "i" : ""}g`);
      while ((match = globalPattern.exec(text)) !== null) {
        const window = text.slice(Math.max(0, match.index - 1200), match.index + 1200);
        if (!DOCTRINE_CONFLICT_LABEL.some((label) => label.test(window))) {
          unlabeled.push(`${doc}: ${match[0]}`);
        }
      }
    }
  }

  assert.deepEqual(unlabeled, []);
});

test("adapter-era docs are explicitly labeled before OMI-CIDR wording", () => {
  const expectedLabels = {
    "docs/omi-whitepaper.md": /Historical adapter notice/,
    "docs/03-network/omi-core-spec.md": /Adapter status/,
    "docs/03-network/canonical-addressing.md": /Current status/,
    "docs/omi-notation.md": /Canon alignment notice/,
    "docs/agreement-is-all-you-need.md": /Doctrine alignment notice/
  };

  for (const [doc, label] of Object.entries(expectedLabels)) {
    const text = read(doc).slice(0, 1200);
    assert.match(text, label, `${doc} must label its current authority boundary near the top`);
  }
});
