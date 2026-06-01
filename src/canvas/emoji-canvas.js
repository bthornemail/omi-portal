import { EMOJI_TEST_SOURCE, EMOJI_VENDOR_SOURCES } from "../omi/emoji-data.js";

export class OmiEmojiCanvasKernel {
  constructor() {}

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  generateEmojiCanvas(emojiEntries, options = {}) {
    const gridCols = options.gridCols || 60;
    const cellWidth = options.cellWidth || 48;
    const cellHeight = options.cellHeight || 36;
    const gap = options.gap || 4;
    const maxEntries = options.maxEntries || emojiEntries.length;
    const entries = emojiEntries.slice(0, maxEntries);
    const nodes = [];

    for (const entry of entries) {
      const { r, g, b, base64, col, row } = this._rgbBase64Hash(entry.codepoints);
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);
      const addr = `Ο-${col}-${row}`;
      const hexColor = this._rgbToHex(r, g, b);

      nodes.push({
        id: `emoji-${entry.codepoints.join("-").toLowerCase()}`,
        type: "text",
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        color: hexColor,
        text: entry.text,
        file: EMOJI_TEST_SOURCE,
        url: `web+omi:emoji:${entry.codepoints.join("-").toLowerCase()}`,
        group: entry.group,
        omi: {
          role: "OmicronNode",
          authority: "projection-only",
          address: addr,
          cons: Object.freeze({ car: col, cdr: row }),
          rgb: { r, g, b },
          base64,
          col,
          row,
          group: entry.group,
          subgroup: entry.subgroup,
          file: EMOJI_TEST_SOURCE,
          sourceFiles: EMOJI_VENDOR_SOURCES,
          link: `web+omi:emoji:${entry.codepoints.join("-").toLowerCase()}`,
          status: entry.status,
          version: entry.version,
          name: entry.name
        }
      });
    }

    return JSON.stringify({ nodes, edges: [] }, null, 2);
  }

  _rgbBase64Hash(codepoints) {
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

  _rgbToHex(r, g, b) {
    return "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
  }

  buildCellIndex(nodesJson) {
    const spec = JSON.parse(nodesJson);
    const byAddress = new Map();
    const byGroup = new Map();
    const byColRow = new Map();
    for (const node of spec.nodes) {
      const omi = node.omi;
      byAddress.set(omi.address, node);
      byColRow.set(`${omi.col},${omi.row}`, node);
      if (!byGroup.has(omi.group)) byGroup.set(omi.group, []);
      byGroup.get(omi.group).push(node);
    }
    return { nodes: spec.nodes, edges: spec.edges, byAddress, byGroup, byColRow };
  }
}
