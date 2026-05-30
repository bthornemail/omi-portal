// OmiAxiomaticRulesCompiler — validates 128-bit OMI frames against /RULES.omi
export class OmiAxiomaticRulesCompiler {
  constructor(rulesText) {
    this.rules = [];
    this._compile(rulesText);
  }

  _compile(text) {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
      const match = trimmed.match(/^omi-([0-9a-fA-F-]+)\/(\d+)\s+(MUST|FACT|EQUALS)\s+(.+)$/);
      if (!match) continue;
      const addrHex = match[1].replace(/-/g, '');
      const prefixBits = parseInt(match[2], 10);
      const keyword = match[3];
      const value = match[4].trim();
      const segments = [];
      for (let i = 0; i < addrHex.length; i += 4) {
        segments.push(parseInt(addrHex.substring(i, i + 4), 16));
      }
      this.rules.push({ segments, prefixBits, keyword, value });
    }
  }

  match(omiFrame) {
    const results = [];
    for (const rule of this.rules) {
      if (this._matchesPrefix(omiFrame, rule.segments, rule.prefixBits)) {
        results.push(rule);
      }
    }
    return results;
  }

  _matchesPrefix(frame, ruleSegments, prefixBits) {
    const prefixSegments = Math.ceil(prefixBits / 16);
    for (let i = 0; i < prefixSegments; i++) {
      if (i >= ruleSegments.length) break;
      const frameIdx = i * 2;
      if (frameIdx + 1 >= frame.length) break;
      const frameVal = (frame[frameIdx] << 8) | frame[frameIdx + 1];
      if (frameVal !== ruleSegments[i]) return false;
    }
    return true;
  }

  evaluateAxiomaticRegister(S, segmentIndex, rawSegmentHexValue) {
    if (!Array.isArray(S) || S.length !== 16) {
      return { valid: false, reason: 'S must be a 16-byte array' };
    }
    if (segmentIndex < 0 || segmentIndex > 7) {
      return { valid: false, reason: 'segmentIndex out of range (0-7)' };
    }
    if (typeof rawSegmentHexValue !== 'number') {
      return { valid: false, reason: 'rawSegmentHexValue must be a number' };
    }
    const targetValue = Number(rawSegmentHexValue) & 0xFFFF;
    const matchedRules = [];
    for (const rule of this.rules) {
      if (rule.segments[segmentIndex] === targetValue && rule.keyword === 'MUST') {
        matchedRules.push(rule);
      }
    }
    return { valid: matchedRules.length > 0, matchedRules };
  }
}
