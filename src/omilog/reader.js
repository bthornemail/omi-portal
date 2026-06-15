import {
  LITTLE_OMICRON,
  BIG_OMICRON,
  IMO_CONTROLS
} from './omi-imo-compiler.js';

const RS = IMO_CONTROLS.RS;
const US = IMO_CONTROLS.US;

const IMO_RECORD_RE = new RegExp(
  `^\\s*${LITTLE_OMICRON}\\s+([!=\\)\\.+])\\/(\\S+)\\s+${BIG_OMICRON}\\s*$`
);

const IMO_SOURCE_RE = new RegExp(
  `^\\s*${LITTLE_OMICRON}\\s+${RS}([^${US}]+)${US}\\s+${BIG_OMICRON}\\s*$`
);

const OMI_ADDRESS_RE = /^(?:omi-(?:[0-9a-fA-F]{1,8}-){7}[0-9a-fA-F]{1,8}|ffff-(?:[0-9a-fA-F]{1,8}-){6}[0-9a-fA-F]{1,8})(?:\/\d{1,3}(?:-\d{1,3})?)?(?:\/@\d+)*$/;
const OMI_FRAME_MNEMONIC_RE = /^omi-+-imo$/;
const OMI_LOW_ALIAS_RE = /^omi(?:-.+)?$/;
const OMI_HIGH_ALIAS_RE = /^(?:imo-.+|.+-imo)$/;

const EMOJI_RE = /^\p{Extended_Pictographic}/u;

export class OExpressionSyntaxError extends Error {
  constructor(message, { pos, line, col, source } = {}) {
    const snippet = source && pos != null
      ? source.slice(Math.max(0, pos - 20), pos + 20)
      : '';
    const loc = line != null ? ` at line ${line}, col ${col}` : '';
    super(`${message}${loc}${snippet ? ` near \`${snippet}\`` : ''}`);
    this.name = 'OExpressionSyntaxError';
    this.pos = pos;
    this.line = line;
    this.col = col;
    this.source = source;
  }
}

class ReaderState {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
  }

  get done() {
    return this.pos >= this.source.length;
  }

  peek() {
    return this.source[this.pos] || '';
  }

  next() {
    const c = this.source[this.pos++];
    if (c === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return c;
  }

  expect(ch) {
    this.skipWs();
    if (this.peek() !== ch) {
      throw new OExpressionSyntaxError(
        `Expected '${ch}', got '${this.peek()}'`,
        { pos: this.pos, line: this.line, col: this.col, source: this.source }
      );
    }
    return this.next();
  }

  skipWs() {
    while (!this.done) {
      const c = this.peek();
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        this.next();
      } else if (c === ';') {
        while (!this.done && this.peek() !== '\n') this.next();
      } else {
        break;
      }
    }
  }

  error(message) {
    throw new OExpressionSyntaxError(message, {
      pos: this.pos,
      line: this.line,
      col: this.col,
      source: this.source
    });
  }
}

function readExpr(state) {
  state.skipWs();
  if (state.done) return null;

  const c = state.peek();

  if (c === '(') return readList(state);
  if (c === "'" || c === '`') return readQuoted(state);
  if (c === RS) return readSourceBlock(state);
  if (c === ')' || isIsolatedDot(state)) {
    state.error(`Unexpected '${c}' at top level`);
  }

  if (c === '"') return readString(state);
  if (isEmojiStart(c, state)) return readEmojiAtom(state);

  return readAtom(state);
}

function readList(state) {
  state.next();
  const items = [];

  while (!state.done) {
    state.skipWs();
    if (state.peek() === ')') {
      state.next();
      return { type: 'list', items };
    }
    if (isIsolatedDot(state)) {
      state.next();
      state.skipWs();
      const last = readExpr(state);
      state.skipWs();
      state.expect(')');
      if (items.length === 0) {
        return { type: 'pair', car: null, cdr: last };
      }
      let pair = { type: 'pair', car: items.pop(), cdr: last };
      while (items.length > 0) {
        pair = { type: 'pair', car: items.pop(), cdr: pair };
      }
      return pair;
    }
    items.push(readExpr(state));
  }

  state.error('Unterminated list: expected )');
}

function readQuoted(state) {
  const quote = state.next();
  const expr = readExpr(state);
  if (expr === null) state.error('Missing expression after quote');
  return {
    type: 'quoted',
    quote,
    expr
  };
}

function readSourceBlock(state) {
  state.expect(RS);
  let addr = '';
  while (!state.done && state.peek() !== US) {
    addr += state.next();
  }
  if (state.peek() === US) state.next();
  return { type: 'source-block', address: addr };
}

function readString(state) {
  state.expect('"');
  let value = '';
  while (!state.done && state.peek() !== '"') {
    if (state.peek() === '\\') {
      state.next();
      const esc = state.next();
      if (esc === 'n') value += '\n';
      else if (esc === 't') value += '\t';
      else if (esc === '"') value += '"';
      else if (esc === '\\') value += '\\';
      else value += '\\' + esc;
    } else {
      value += state.next();
    }
  }
  if (state.peek() === '"') state.next();
  else state.error('Unterminated string');
  return { type: 'string', value };
}

function isIsolatedDot(state) {
  if (state.peek() !== '.') return false;
  const next = state.source[state.pos + 1] || '';
  return next === '' ||
    next === ' ' ||
    next === '\t' ||
    next === '\n' ||
    next === '\r' ||
    next === '(' ||
    next === ')' ||
    next === ';';
}

function readAtom(state) {
  let value = '';
  while (!state.done) {
    const c = state.peek();
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' ||
        c === '(' || c === ')' || c === "'" || c === '`' ||
        c === ';' || c === RS || c === US || c === '"') {
      break;
    }
    value += state.next();
  }
  if (!value) state.error('Empty atom');

  return classifyAtom(value);
}

function isEmojiStart(c, state) {
  return EMOJI_RE.test(c) || (c >= '\uD800' && c <= '\uDFFF');
}

function readEmojiAtom(state) {
  let value = '';
  while (!state.done) {
    const c = state.peek();
    if (!EMOJI_RE.test(c) && c !== '\u200D' && c !== '\uFE0F' &&
        !(c >= '\uD800' && c <= '\uDFFF') && c !== '\u0023' && c !== '\u002A' &&
        !(c >= '\u0030' && c <= '\u0039') &&
        !(c >= '\u2600' && c <= '\u27BF') &&
        !(c >= '\u2B50' && c <= '\u2B55') &&
        !(c >= '\u2934' && c <= '\u2935') &&
        !(c >= '\u3030' && c <= '\u303D') &&
        !(c >= '\u3297' && c <= '\u3299') &&
        c !== '\u00A9' && c !== '\u00AE' && c !== '\u2122') {
      break;
    }
    value += state.next();
  }
  if (!value) state.error('Empty emoji atom');
  return { type: 'emoji', value };
}

function classifyAtom(value) {
  if (value === 'nil' || value === '()') {
    return { type: 'nil' };
  }
  if (value === 'true') {
    return { type: 'atom', value: 'true' };
  }
  if (value === 'false') {
    return { type: 'atom', value: 'false' };
  }

  if (isOmiAddressAtom(value)) {
    return { type: 'omi-address', value };
  }

  const omiAlias = classifyOmiAlias(value);
  if (omiAlias) {
    return omiAlias;
  }

  if (/^-?\d+$/.test(value)) {
    return { type: 'number', value: parseInt(value, 10) };
  }

  if (EMOJI_RE.test(value)) {
    return { type: 'emoji', value };
  }

  return { type: 'atom', value };
}

export function readOExpression(source) {
  if (typeof source !== 'string') return null;
  const state = new ReaderState(source);
  state.skipWs();
  if (state.done) return null;
  const expr = readExpr(state);
  state.skipWs();
  if (!state.done && state.peek() !== ';') {
    throw new OExpressionSyntaxError(
      `Unexpected trailing content after expression`,
      { pos: state.pos, line: state.line, col: state.col, source }
    );
  }
  return expr;
}

export function readOExpressionList(source) {
  if (typeof source !== 'string') return [];
  const state = new ReaderState(source);
  const results = [];
  while (!state.done) {
    state.skipWs();
    if (state.done) break;
    results.push(readExpr(state));
  }
  return results;
}

export function readOExpressionAtom(source) {
  if (typeof source !== 'string') return null;
  const state = new ReaderState(source);
  state.skipWs();
  if (state.done) return null;
  const expr = readExpr(state);
  if (expr.type !== 'atom' && expr.type !== 'number' &&
      expr.type !== 'omi-address' && expr.type !== 'emoji' &&
      expr.type !== 'omi-frame-mnemonic' &&
      expr.type !== 'omi-low-alias' &&
      expr.type !== 'omi-high-alias' &&
      expr.type !== 'nil' && expr.type !== 'string') {
    throw new OExpressionSyntaxError(
      `Expected atom, got ${expr.type}`,
      { pos: state.pos, line: state.line, col: state.col, source }
    );
  }
  return expr;
}

export function readOExpressionPair(source) {
  if (typeof source !== 'string') return null;
  const state = new ReaderState(source);
  state.skipWs();
  state.expect('(');
  state.skipWs();
  const car = readExpr(state);
  state.skipWs();
  if (!isIsolatedDot(state)) {
    state.error(`Expected isolated '.', got '${state.peek()}'`);
  }
  state.next();
  state.skipWs();
  const cdr = readExpr(state);
  state.skipWs();
  state.expect(')');
  return { type: 'pair', car, cdr };
}

export function readQuotedForm(source) {
  if (typeof source !== 'string' || (source[0] !== "'" && source[0] !== '`')) {
    throw new OExpressionSyntaxError(
      `Expected quoted expression starting with ' or \``
    );
  }
  const state = new ReaderState(source);
  return readQuoted(state);
}

export function readImoRecord(record) {
  if (typeof record !== 'string') return null;

  const srcMatch = IMO_SOURCE_RE.exec(record);
  if (srcMatch) {
    return {
      type: 'imo-record',
      operator: 'source',
      address: srcMatch[1].trim()
    };
  }

  const recMatch = IMO_RECORD_RE.exec(record);
  if (recMatch) {
    return {
      type: 'imo-record',
      operator: recMatch[1],
      address: recMatch[2].trim()
    };
  }

  throw new OExpressionSyntaxError(
    `Invalid .imo record format: ${record.slice(0, 60).trim()}`
  );
}

export function readImoPayloadBlock(block) {
  if (typeof block !== 'string') return [];
  const lines = block.split('\n').filter(l => l.trim());
  const records = [];
  for (let i = 0; i < lines.length; i++) {
    const rec = readImoRecord(lines[i]);
    records.push(rec);
    if (rec.operator !== 'source' && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const srcMatch = IMO_SOURCE_RE.exec(nextLine);
      if (srcMatch) {
        rec.sourceAddress = srcMatch[1].trim();
        i++;
      }
    }
  }
  return records;
}

export function isEmojiAtom(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  const single = /^\p{Extended_Pictographic}\uFE0F?$/u;
  const zwj = /^\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic})+$/u;
  const flagSeq = /^[\u0023\u002A\u0030-\u0039]\uFE0F\u20E3$/u;
  const epPres = /^\p{Emoji_Presentation}$/u;
  return single.test(value) || zwj.test(value) || flagSeq.test(value) || epPres.test(value);
}

export function isOmiAddressAtom(value) {
  if (typeof value !== 'string') return false;
  const match = OMI_ADDRESS_RE.exec(value);
  return match !== null && match[0].length === value.length;
}

export function classifyOmiAlias(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (isOmiAddressAtom(value)) return null;
  if (OMI_FRAME_MNEMONIC_RE.test(value)) {
    return { type: 'omi-frame-mnemonic', value };
  }
  if (OMI_LOW_ALIAS_RE.test(value)) {
    return { type: 'omi-low-alias', value };
  }
  if (OMI_HIGH_ALIAS_RE.test(value)) {
    return { type: 'omi-high-alias', value };
  }
  return null;
}

export function isOmiAliasAtom(value) {
  return classifyOmiAlias(value) !== null;
}
