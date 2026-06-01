import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMOJI_TEST_SOURCE, EMOJI_VENDOR_SOURCES, OmiEmojiDataKernel } from '../src/omi/emoji-data.js';
import { OmiEmojiCanvasKernel } from '../src/canvas/emoji-canvas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EMOJI_TEST_PATH = join(__dirname, '..', 'vendor', 'emoji', 'emoji-test.txt');
const EMOJI_SEQUENCE_PATH = join(__dirname, '..', 'vendor', 'emoji', 'emoji-sequences.txt');
const EMOJI_ZWJ_SEQUENCE_PATH = join(__dirname, '..', 'vendor', 'emoji', 'emoji-zwj-sequences.txt');

function loadEmojiTestFile() {
  return readFileSync(EMOJI_TEST_PATH, 'utf-8');
}

test('EmojiDataKernel: parses group and subgroup headers', () => {
  const kernel = new OmiEmojiDataKernel();
  const text = `# group: Smileys & Emotion\n\n# subgroup: face-smiling\n1F600 ; fully-qualified # 😀 E1.0 grinning face`;
  const entries = kernel.parseEmojiTestFile(text);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].group, "Smileys & Emotion");
  assert.equal(entries[0].subgroup, "face-smiling");
  assert.equal(entries[0].name, "grinning face");
  assert.equal(entries[0].version, "E1.0");
  assert.equal(entries[0].status, "fully-qualified");
});

test('EmojiDataKernel: parses multi-codepoint emoji', () => {
  const kernel = new OmiEmojiDataKernel();
  const text = `# group: People & Body\n# subgroup: person\n1F468 200D 1F9B3 ; fully-qualified # 👨‍🦳 E11.0 person: white hair`;
  const entries = kernel.parseEmojiTestFile(text);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].codepoints, ["1F468", "200D", "1F9B3"]);
  assert.equal(entries[0].text, String.fromCodePoint(0x1F468, 0x200D, 0x1F9B3));
  assert.equal(entries[0].version, "E11.0");
});

test('EmojiDataKernel: parses full emoji-test.txt file', () => {
  const kernel = new OmiEmojiDataKernel();
  const text = loadEmojiTestFile();
  const entries = kernel.parseEmojiTestFile(text);
  assert.ok(entries.length > 5200);
  const fq = entries.filter(e => e.status === "fully-qualified");
  assert.equal(fq.length, 3944);
  const groups = [...new Set(entries.map(e => e.group).filter(Boolean))];
  assert.equal(groups.length, 10);
  assert.ok(groups.includes("Smileys & Emotion"));
  assert.ok(groups.includes("Flags"));
});

test('EmojiDataKernel: Unicode vendor sources are canonical projection provenance', () => {
  assert.deepEqual(EMOJI_VENDOR_SOURCES, [
    "vendor/emoji/emoji-test.txt",
    "vendor/emoji/emoji-sequences.txt",
    "vendor/emoji/emoji-zwj-sequences.txt"
  ]);
  assert.equal(EMOJI_TEST_SOURCE, "vendor/emoji/emoji-test.txt");
  assert.ok(readFileSync(EMOJI_TEST_PATH, 'utf-8').includes("# group: Smileys & Emotion"));
  assert.ok(readFileSync(EMOJI_SEQUENCE_PATH, 'utf-8').includes("# emoji-sequences.txt"));
  assert.ok(readFileSync(EMOJI_ZWJ_SEQUENCE_PATH, 'utf-8').includes("# emoji-zwj-sequences.txt"));
  assert.equal(EMOJI_VENDOR_SOURCES.every(source => source.startsWith("vendor/emoji/")), true);
  assert.equal(EMOJI_VENDOR_SOURCES.every(source => !source.includes("dev-docs/_temp")), true);
});

test('EmojiDataKernel: rgbBase64Hash produces deterministic RGB from codepoints', () => {
  const kernel = new OmiEmojiDataKernel();
  const h1 = kernel.rgbBase64Hash(["1F600"]);
  assert.ok(h1.r >= 0 && h1.r <= 255);
  assert.ok(h1.g >= 0 && h1.g <= 255);
  assert.ok(h1.b >= 0 && h1.b <= 255);
  assert.ok(h1.base64.length === 4);
  assert.equal(h1.col, h1.r % 60);
  assert.equal(h1.row, h1.g % 60);
  const h2 = kernel.rgbBase64Hash(["1F600"]);
  assert.equal(h1.base64, h2.base64);
});

test('EmojiDataKernel: different codepoints produce different hashes', () => {
  const kernel = new OmiEmojiDataKernel();
  const h1 = kernel.rgbBase64Hash(["1F600"]);
  const h2 = kernel.rgbBase64Hash(["1F601"]);
  const h3 = kernel.rgbBase64Hash(["1F468", "200D", "1F9B3"]);
  assert.notEqual(h1.base64, h2.base64);
  assert.notEqual(h1.base64, h3.base64);
});

test('EmojiDataKernel: toOmicronCell builds OmicronNode with text/link/group/file', () => {
  const kernel = new OmiEmojiDataKernel();
  const text = `# group: Smileys & Emotion\n# subgroup: face-smiling\n1F600 ; fully-qualified # 😀 E1.0 grinning face`;
  const entries = kernel.parseEmojiTestFile(text);
  const cell = kernel.toOmicronCell(entries[0]);
  assert.equal(cell.omi.role, "OmicronNode");
  assert.equal(cell.omi.authority, "projection-only");
  assert.equal(cell.omi.text, "😀");
  assert.equal(cell.omi.link, "web+omi:emoji:1f600");
  assert.equal(cell.omi.group, "Smileys & Emotion");
  assert.equal(cell.omi.file, EMOJI_TEST_SOURCE);
  assert.deepEqual(cell.omi.sourceFiles, EMOJI_VENDOR_SOURCES);
  assert.ok(cell.omi.col >= 0);
  assert.ok(cell.omi.row >= 0);
  assert.ok(cell.address.startsWith("Ο-"));
  assert.equal(typeof cell.cons.car, "number");
  assert.equal(typeof cell.cons.cdr, "number");
  assert.equal(cell.cons.car, cell.omi.col);
  assert.equal(cell.cons.cdr, cell.omi.row);
});

test('EmojiDataKernel: toCanvasCells returns complete cell array', () => {
  const kernel = new OmiEmojiDataKernel();
  const text = loadEmojiTestFile();
  const entries = kernel.parseEmojiTestFile(text);
  const cells = kernel.toCanvasCells(entries);
  assert.equal(cells.length, entries.length);
  const cell0 = cells[0];
  assert.ok(cell0.address);
  assert.equal(cell0.omi.role, "OmicronNode");
  assert.ok(cell0.omi.rgb);
  assert.ok(cell0.omi.base64);
});

test('EmojiCanvasKernel: generates canvas spec with OmicronNode grid cells', () => {
  const dataKernel = new OmiEmojiDataKernel();
  const canvasKernel = new OmiEmojiCanvasKernel();
  const text = `# group: Smileys & Emotion\n# subgroup: face-smiling\n1F600 ; fully-qualified # 😀 E1.0 grinning face\n1F603 ; fully-qualified # 😃 E0.6 grinning face with big eyes`;
  const entries = dataKernel.parseEmojiTestFile(text);
  const spec = JSON.parse(canvasKernel.generateEmojiCanvas(entries));
  assert.equal(spec.nodes.length, 2);
  assert.equal(spec.edges.length, 0);
  const n0 = spec.nodes[0];
  assert.equal(n0.omi.role, "OmicronNode");
  assert.equal(n0.omi.authority, "projection-only");
  assert.ok(n0.text);
  assert.equal(n0.file, EMOJI_TEST_SOURCE);
  assert.ok(n0.url);
  assert.equal(n0.omi.group, "Smileys & Emotion");
  assert.deepEqual(n0.omi.sourceFiles, EMOJI_VENDOR_SOURCES);
  assert.ok(n0.x >= 0);
  assert.ok(n0.y >= 0);
  assert.ok(n0.color.startsWith("#"));
  assert.equal(spec.nodes[1].omi.group, "Smileys & Emotion");
});

test('EmojiCanvasKernel: buildCellIndex provides group and col/row lookups', () => {
  const dataKernel = new OmiEmojiDataKernel();
  const canvasKernel = new OmiEmojiCanvasKernel();
  const text = `# group: Smileys & Emotion\n# subgroup: face-smiling\n1F600 ; fully-qualified # 😀 E1.0 grinning face\n# group: Flags\n# subgroup: flag\n1F3F4 E0067 E0062 E0065 E006E E0067 E007F ; fully-qualified # 🏴󠁧󠁢󠁥󠁮󠁧󠁿 E5.0 flag: England`;
  const entries = dataKernel.parseEmojiTestFile(text);
  const spec = canvasKernel.generateEmojiCanvas(entries);
  const index = canvasKernel.buildCellIndex(spec);
  assert.equal(index.nodes.length, 2);
  assert.ok(index.byGroup.has("Smileys & Emotion"));
  assert.ok(index.byGroup.has("Flags"));
  assert.equal(index.byGroup.get("Smileys & Emotion").length, 1);
  assert.equal(index.byGroup.get("Flags").length, 1);
  const firstAddr = index.nodes[0].omi.address;
  assert.ok(index.byAddress.has(firstAddr));
});

test('EmojiCanvasKernel: full file canvas generation with constraints', () => {
  const dataKernel = new OmiEmojiDataKernel();
  const canvasKernel = new OmiEmojiCanvasKernel();
  const text = loadEmojiTestFile();
  const entries = dataKernel.parseEmojiTestFile(text);
  const spec = JSON.parse(canvasKernel.generateEmojiCanvas(entries, { maxEntries: 100 }));
  assert.equal(spec.nodes.length, 100);
  assert.ok(spec.nodes.every(n => n.omi.role === "OmicronNode"));
  assert.ok(spec.nodes.every(n => n.omi.group));
  assert.ok(spec.nodes.every(n => n.omi.file === EMOJI_TEST_SOURCE));
  assert.ok(spec.nodes.every(n => n.omi.sourceFiles.every(source => source.startsWith("vendor/emoji/"))));
});
