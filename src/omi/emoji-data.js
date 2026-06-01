export const EMOJI_VENDOR_SOURCES = Object.freeze([
  "vendor/emoji/emoji-test.txt",
  "vendor/emoji/emoji-sequences.txt",
  "vendor/emoji/emoji-zwj-sequences.txt"
]);

export const EMOJI_TEST_SOURCE = EMOJI_VENDOR_SOURCES[0];

export class OmiEmojiDataKernel {
  parseEmojiTestFile(text) {
    const entries = [];
    let currentGroup = "";
    let currentSubgroup = "";
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# group:")) {
        currentGroup = trimmed.slice(8).trim();
        currentSubgroup = "";
        continue;
      }
      if (trimmed.startsWith("# subgroup:")) {
        currentSubgroup = trimmed.slice(11).trim();
        continue;
      }
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      const semiIdx = trimmed.indexOf(";");
      if (semiIdx === -1) continue;
      const cpPart = trimmed.slice(0, semiIdx).trim();
      const rest = trimmed.slice(semiIdx + 1).trim();
      const hashIdx = rest.indexOf("#");
      const status = hashIdx === -1 ? rest.trim() : rest.slice(0, hashIdx).trim();
      let name = "";
      let version = "";
      if (hashIdx !== -1) {
        const namePart = rest.slice(hashIdx + 1).trim();
        const vm = namePart.match(/^.+?\s+(E\d+\.\d+)\s+(.+)$/);
        if (vm) { version = vm[1]; name = vm[2]; }
        else { name = namePart; }
      }
      const codepoints = cpPart.split(/\s+/).filter(Boolean);
      entries.push({
        codepoints,
        status,
        name,
        version,
        group: currentGroup,
        subgroup: currentSubgroup,
        text: this.codepointsToText(codepoints)
      });
    }
    return entries;
  }

  codepointsToText(codepoints) {
    return String.fromCodePoint(...codepoints.map(cp => parseInt(cp, 16)));
  }

  rgbBase64Hash(codepoints) {
    let hash = 0;
    for (const cp of codepoints) hash ^= parseInt(cp, 16);
    const r = (hash >> 16) & 0xFF;
    const g = (hash >> 8) & 0xFF;
    const b = hash & 0xFF;
    const base64 = typeof btoa !== "undefined"
      ? btoa(String.fromCharCode(r, g, b))
      : Buffer.from([r, g, b]).toString("base64");
    return { r, g, b, base64, col: r % 60, row: g % 60 };
  }

  buildCellCons(column, row) {
    return Object.freeze({ car: column, cdr: row });
  }

  toOmicronCell(entry) {
    const { r, g, b, base64, col, row } = this.rgbBase64Hash(entry.codepoints);
    const consCell = this.buildCellCons(col, row);
    return {
      cons: consCell,
      address: `Ο-${col}-${row}`,
      omi: {
        role: "OmicronNode",
        authority: "projection-only",
        text: entry.text,
        link: `web+omi:emoji:${entry.codepoints.join("-").toLowerCase()}`,
        group: entry.group,
        subgroup: entry.subgroup,
        file: EMOJI_TEST_SOURCE,
        sourceFiles: EMOJI_VENDOR_SOURCES,
        rgb: { r, g, b },
        base64,
        col,
        row,
        status: entry.status,
        version: entry.version,
        name: entry.name
      }
    };
  }

  toCanvasCells(entries) {
    return entries.map(e => this.toOmicronCell(e));
  }
}
