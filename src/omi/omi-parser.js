export const OMI_DECLARATIVE_KEYWORDS = Object.freeze([
  "MUST",
  "FACT",
  "EQUALS",
  "CLOSE",
  "COMBINE",
  "CONS"
]);

export const OMI_SECTION_LABELS = Object.freeze([
  "INPUT",
  "FORM",
  "OUTPUT",
  "PROPERTY",
  "REQUIRES",
  "SEALS",
  "FORBIDS",
  "BOUNDARY",
  "AUTHORITY",
  "DOT",
  "ALIST",
  "TRUTH",
  "KARNAUGH",
  "STATE",
  "FUNCTION",
  "SLIDE_RULE",
  "CANONICAL",
  "DERIVED_FROM"
]);

const KEYWORD_PATTERN = OMI_DECLARATIVE_KEYWORDS.join("|");
const CLAUSE_RE = new RegExp(
  `^(omi-(?:[0-9a-fA-F]{4}-){7}[0-9a-fA-F]{4}\\/(\\d{1,3})(?:\\/([^\\s]+))?)\\s+(${KEYWORD_PATTERN})\\s+(.+)$`
);
const SECTION_RE = /^([A-Z][A-Z0-9_]*):\s*(.*)$/;

export function parseOmiClause(line, { source = undefined, lineNumber = undefined } = {}) {
  const text = String(line || "").trim();
  if (!text || text.startsWith("#") || text.startsWith("//")) return null;

  const match = text.match(CLAUSE_RE);
  if (!match) return null;

  const address = match[1];
  const prefixBits = Number(match[2]);
  if (!Number.isInteger(prefixBits) || prefixBits < 0 || prefixBits > 128) return null;

  const suffix = match[3] || null;
  const keyword = match[4];
  const assignment = match[5].trim();
  const addressBody = address.slice(4).split("/")[0];
  const segmentHex = addressBody.split("-").map((segment) => segment.toLowerCase());
  if (segmentHex.length !== 8 || segmentHex.some((segment) => !/^[0-9a-f]{4}$/.test(segment))) {
    return null;
  }

  return {
    address,
    prefixBits,
    suffix,
    keyword,
    assignment,
    rhs: keyword === "EQUALS" ? assignment : null,
    segments: segmentHex.map((segment) => parseInt(segment, 16)),
    segmentHex,
    sections: {},
    line: lineNumber,
    source
  };
}

export function parseOmiDocument(text, { source = undefined } = {}) {
  const records = [];
  const malformed = [];
  let currentRecord = null;
  let currentSection = null;
  let inSourceBlock = false;
  let sourceBlockLines = null;
  let sourceBlockStartLine = null;

  const appendSectionLine = (line) => {
    if (!currentRecord || !currentSection) return false;
    currentRecord.sections[currentSection].lines.push(line.trimEnd());
    return true;
  };

  const closeSourceBlock = (closeLine) => {
    if (!currentRecord) {
      malformed.push({
        line: closeLine,
        source,
        text: "-imo",
        reason: "Source block closer without preceding record"
      });
      return;
    }
    currentRecord.sourceBlock = {
      opener: "omi-",
      closer: "-imo",
      startLine: sourceBlockStartLine,
      endLine: closeLine,
      raw: sourceBlockLines.join("")
    };
  };

  const lines = String(text || "").split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();

    if (inSourceBlock) {
      if (trimmed === "-imo") {
        closeSourceBlock(lineNumber);
        inSourceBlock = false;
        sourceBlockLines = null;
        sourceBlockStartLine = null;
        return;
      }
      sourceBlockLines.push(rawLine + "\n");
      return;
    }

    if (trimmed === "omi-") {
      inSourceBlock = true;
      sourceBlockLines = [];
      sourceBlockStartLine = lineNumber;
      return;
    }

    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return;

    const clause = parseOmiClause(trimmed, { source, lineNumber });
    if (clause) {
      records.push(clause);
      currentRecord = clause;
      currentSection = null;
      return;
    }

    const sectionMatch = trimmed.match(SECTION_RE);
    if (sectionMatch && currentRecord) {
      currentSection = sectionMatch[1];
      if (!currentRecord.sections[currentSection]) {
        currentRecord.sections[currentSection] = { line: lineNumber, lines: [] };
      }
      if (sectionMatch[2]) currentRecord.sections[currentSection].lines.push(sectionMatch[2]);
      return;
    }

    if (currentRecord && currentSection) {
      appendSectionLine(rawLine);
      return;
    }

    if (trimmed.startsWith("omi-") || sectionMatch) {
      malformed.push({
        line: lineNumber,
        source,
        text: rawLine,
        reason: "Unrecognized OMI declarative syntax"
      });
    }
  });

  if (inSourceBlock) {
    malformed.push({
      line: sourceBlockStartLine,
      source,
      text: "omi-",
      reason: "Unclosed omi- source block"
    });
  }

  return {
    records: records.map(finalizeRecordSections),
    malformed
  };
}

function finalizeRecordSections(record) {
  const sections = {};
  for (const [label, section] of Object.entries(record.sections)) {
    sections[label] = section.lines.join("\n").trimEnd();
  }
  return { ...record, sections };
}
