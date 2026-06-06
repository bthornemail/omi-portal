import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  readOExpression,
  readOExpressionList,
  readOExpressionAtom,
  readOExpressionPair,
  readQuotedForm,
  readImoRecord,
  readImoPayloadBlock,
  isEmojiAtom,
  isOmiAddressAtom,
  isOmiAliasAtom,
  OExpressionSyntaxError
} from '../src/omilog/reader.js';

describe('OMI Portal: O-Expression Stream Reader (0x9F)', () => {

  describe('readOExpression — atoms', () => {
    it('parses a symbol atom', () => {
      const expr = readOExpression('hello');
      assert.deepEqual(expr, { type: 'atom', value: 'hello' });
    });

    it('parses a number atom', () => {
      const expr = readOExpression('42');
      assert.deepEqual(expr, { type: 'number', value: 42 });
    });

    it('parses a negative number', () => {
      const expr = readOExpression('-7');
      assert.deepEqual(expr, { type: 'number', value: -7 });
    });

    it('parses nil', () => {
      const expr = readOExpression('nil');
      assert.deepEqual(expr, { type: 'nil' });
    });

    it('parses true/false', () => {
      assert.deepEqual(readOExpression('true'), { type: 'atom', value: 'true' });
      assert.deepEqual(readOExpression('false'), { type: 'atom', value: 'false' });
    });

    it('returns null for empty input', () => {
      assert.strictEqual(readOExpression(''), null);
      assert.strictEqual(readOExpression('   '), null);
    });
  });

  describe('readOExpression — OMI addresses', () => {
    it('parses a full omi- address', () => {
      const expr = readOExpression('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128');
      assert.strictEqual(expr.type, 'omi-address');
      assert.ok(expr.value.startsWith('omi-'));
      assert.ok(expr.value.endsWith('/128'));
    });

    it('parses a short omi- address', () => {
      const expr = readOExpression('omi-0000-0000-0000-0000-0000-0000-009f-0001/128');
      assert.strictEqual(expr.type, 'omi-address');
    });

    it('parses an eight-segment ffff- address', () => {
      const expr = readOExpression('ffff-0000-0000-0000-0000-0000-007f-0001/48');
      assert.strictEqual(expr.type, 'omi-address');
    });

    it('parses omi notation templates as aliases, not addresses', () => {
      assert.deepEqual(readOExpression('omi-abc'), { type: 'omi-low-alias', value: 'omi-abc' });
      assert.deepEqual(readOExpression('imo-abc'), { type: 'omi-high-alias', value: 'imo-abc' });
      assert.deepEqual(readOExpression('omi---imo'), { type: 'omi-frame-mnemonic', value: 'omi---imo' });
    });
  });

  describe('readOExpression — emoji atoms', () => {
    it('parses a single emoji', () => {
      const expr = readOExpression('\u{1F534}');
      assert.strictEqual(expr.type, 'emoji');
    });

    it('parses an emoji in a list', () => {
      const expr = readOExpression('(\u{1F534} \u{1F7E2})');
      assert.strictEqual(expr.type, 'list');
      assert.strictEqual(expr.items.length, 2);
      assert.strictEqual(expr.items[0].type, 'emoji');
      assert.strictEqual(expr.items[1].type, 'emoji');
    });
  });

  describe('readOExpression — lists', () => {
    it('parses an empty list', () => {
      const expr = readOExpression('()');
      assert.deepEqual(expr, { type: 'list', items: [] });
    });

    it('parses a list of atoms', () => {
      const expr = readOExpression('(a b c)');
      assert.strictEqual(expr.type, 'list');
      assert.strictEqual(expr.items.length, 3);
      assert.strictEqual(expr.items[0].value, 'a');
      assert.strictEqual(expr.items[1].value, 'b');
      assert.strictEqual(expr.items[2].value, 'c');
    });

    it('parses nested lists', () => {
      const expr = readOExpression('(a (b c) d)');
      assert.strictEqual(expr.type, 'list');
      assert.strictEqual(expr.items.length, 3);
      assert.strictEqual(expr.items[1].type, 'list');
      assert.strictEqual(expr.items[1].items[0].value, 'b');
    });

    it('parses a list with mixed types', () => {
      const expr = readOExpression('(gen omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128 42)');
      assert.strictEqual(expr.type, 'list');
      assert.strictEqual(expr.items.length, 3);
      assert.strictEqual(expr.items[1].type, 'omi-address');
      assert.strictEqual(expr.items[2].value, 42);
    });

    it('throws on unterminated list', () => {
      assert.throws(() => readOExpression('(a b'), OExpressionSyntaxError);
    });
  });

  describe('readOExpression — dotted pairs', () => {
    it('parses a dotted pair (a . b)', () => {
      const expr = readOExpression('(a . b)');
      assert.strictEqual(expr.type, 'pair');
      assert.strictEqual(expr.car.value, 'a');
      assert.strictEqual(expr.cdr.value, 'b');
    });

    it('parses a dotted pair with list cdr', () => {
      const expr = readOExpression('(a . (b c))');
      assert.strictEqual(expr.type, 'pair');
      assert.strictEqual(expr.cdr.type, 'list');
    });
  });

  describe('readOExpression — quoted forms', () => {
    it('parses a quoted atom', () => {
      const expr = readOExpression("'hello");
      assert.strictEqual(expr.type, 'quoted');
      assert.strictEqual(expr.quote, "'");
      assert.strictEqual(expr.expr.value, 'hello');
    });

    it('parses a backtick-quoted form', () => {
      const expr = readOExpression('`(a b)');
      assert.strictEqual(expr.type, 'quoted');
      assert.strictEqual(expr.quote, '`');
    });

    it('parses a quoted list', () => {
      const expr = readOExpression("'(a b c)");
      assert.strictEqual(expr.type, 'quoted');
      assert.strictEqual(expr.expr.type, 'list');
    });

    it('throws on bare quote with no expression', () => {
      assert.throws(() => readOExpression("'"), OExpressionSyntaxError);
    });
  });

  describe('readOExpression — strings', () => {
    it('parses a quoted string', () => {
      const expr = readOExpression('"hello world"');
      assert.strictEqual(expr.type, 'string');
      assert.strictEqual(expr.value, 'hello world');
    });

    it('parses a string with escape sequences', () => {
      const expr = readOExpression('"line1\\nline2"');
      assert.strictEqual(expr.value, 'line1\nline2');
    });

    it('throws on unterminated string', () => {
      assert.throws(() => readOExpression('"unterminated'), OExpressionSyntaxError);
    });
  });

  describe('readOExpression — source blocks', () => {
    it('parses an RS/US source block reference', () => {
      const expr = readOExpression('\x1e0-0-0-0-0-0-121-49153/128\x1f');
      assert.strictEqual(expr.type, 'source-block');
      assert.ok(expr.address.includes('121'));
    });
  });

  describe('readOExpression — trailing content', () => {
    it('throws on unexpected trailing content', () => {
      assert.throws(() => readOExpression('a b'), OExpressionSyntaxError);
    });
  });

  describe('readOExpressionList', () => {
    it('reads multiple expressions', () => {
      const exprs = readOExpressionList('a b c');
      assert.strictEqual(exprs.length, 3);
    });

    it('reads expressions separated by newlines', () => {
      const exprs = readOExpressionList('a\nb\nc');
      assert.strictEqual(exprs.length, 3);
    });

    it('skips comments', () => {
      const exprs = readOExpressionList('a ; this is a comment\nb');
      assert.strictEqual(exprs.length, 2);
    });

    it('returns [] for empty input', () => {
      assert.deepEqual(readOExpressionList(''), []);
      assert.deepEqual(readOExpressionList('   '), []);
    });
  });

  describe('readOExpressionAtom', () => {
    it('reads a symbol atom', () => {
      const expr = readOExpressionAtom('hello');
      assert.strictEqual(expr.type, 'atom');
    });

    it('reads a number atom', () => {
      const expr = readOExpressionAtom('42');
      assert.strictEqual(expr.type, 'number');
    });

    it('throws on a list', () => {
      assert.throws(() => readOExpressionAtom('(a b)'), OExpressionSyntaxError);
    });
  });

  describe('readOExpressionPair', () => {
    it('reads a dotted pair', () => {
      const expr = readOExpressionPair('(a . b)');
      assert.strictEqual(expr.type, 'pair');
      assert.strictEqual(expr.car.value, 'a');
      assert.strictEqual(expr.cdr.value, 'b');
    });

    it('throws without parentheses', () => {
      assert.throws(() => readOExpressionPair('a . b'), OExpressionSyntaxError);
    });
  });

  describe('readQuotedForm', () => {
    it('reads a quoted form', () => {
      const expr = readQuotedForm("'hello");
      assert.strictEqual(expr.type, 'quoted');
    });

    it('throws on non-quoted input', () => {
      assert.throws(() => readQuotedForm('hello'), OExpressionSyntaxError);
    });
  });

  describe('readImoRecord', () => {
    it('parses a MUST record', () => {
      const rec = readImoRecord('ο !/0-0-0-0-0-0-0-0/48 Ο');
      assert.strictEqual(rec.type, 'imo-record');
      assert.strictEqual(rec.operator, '!');
      assert.strictEqual(rec.address, '0-0-0-0-0-0-0-0/48');
    });

    it('parses a FACT record', () => {
      const rec = readImoRecord('ο =/0-0-0-1-0-0-0-0/48 Ο');
      assert.strictEqual(rec.operator, '=');
    });

    it('parses a CLOSE record', () => {
      const rec = readImoRecord('ο )/0-0-0-0-0-0-121-49153/128 Ο');
      assert.strictEqual(rec.operator, ')');
    });

    it('parses a COMBINE record', () => {
      const rec = readImoRecord('ο +/0-0-23100-0-0-0-0-45057/128 Ο');
      assert.strictEqual(rec.operator, '+');
    });

    it('parses a CONS record', () => {
      const rec = readImoRecord('ο ./0-0-0-0-0-0-49157-1/128 Ο');
      assert.strictEqual(rec.operator, '.');
    });

    it('parses a source block record', () => {
      const rec = readImoRecord('ο \x1e0-0-0-0-0-0-121-49153/128\x1f Ο');
      assert.strictEqual(rec.operator, 'source');
    });

    it('throws on invalid format', () => {
      assert.throws(() => readImoRecord('not an imo record'), OExpressionSyntaxError);
    });
  });

  describe('readImoPayloadBlock', () => {
    it('parses multiple records', () => {
      const block = [
        'ο !/65535-0-0-0-0-0-0-0/48 Ο',
        'ο =/0-0-0-1-0-0-0-0/48 Ο',
        'ο )/0-0-0-0-0-0-121-49153/128 Ο'
      ].join('\n');
      const records = readImoPayloadBlock(block);
      assert.strictEqual(records.length, 3);
      assert.strictEqual(records[0].operator, '!');
      assert.strictEqual(records[1].operator, '=');
      assert.strictEqual(records[2].operator, ')');
    });

    it('attaches source blocks to preceding records', () => {
      const block = [
        'ο )/0-0-0-0-0-0-121-49153/128 Ο',
        'ο \x1e0-0-0-0-0-0-121-49153/128\x1f Ο',
        'ο =/0-0-0-1-0-0-0-0/48 Ο'
      ].join('\n');
      const records = readImoPayloadBlock(block);
      assert.strictEqual(records.length, 2);
      assert.strictEqual(records[0].operator, ')');
      assert.strictEqual(records[0].sourceAddress, '0-0-0-0-0-0-121-49153/128');
      assert.strictEqual(records[1].operator, '=');
    });

    it('returns [] for empty input', () => {
      assert.deepEqual(readImoPayloadBlock(''), []);
    });
  });

  describe('isEmojiAtom', () => {
    it('detects a single emoji as true', () => {
      assert.ok(isEmojiAtom('\u{1F534}'));
    });

    it('detects a text emoji as true', () => {
      assert.ok(isEmojiAtom('\u00A9\uFE0F'));
    });

    it('returns false for plain text', () => {
      assert.ok(!isEmojiAtom('hello'));
    });

    it('returns false for numbers', () => {
      assert.ok(!isEmojiAtom('42'));
    });

    it('returns false for empty string', () => {
      assert.ok(!isEmojiAtom(''));
    });
  });

  describe('isOmiAddressAtom', () => {
    it('detects a full OMI address', () => {
      assert.ok(isOmiAddressAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128'));
    });

    it('detects an eight-segment ffff- address', () => {
      assert.ok(isOmiAddressAtom('ffff-0000-0000-0000-0000-0000-007f-0001/48'));
    });

    it('detects a short OMI address', () => {
      assert.ok(isOmiAddressAtom('omi-0000-0000-0000-0000-0000-0000-009f-0001/128'));
    });

    it('returns false for plain atom', () => {
      assert.ok(!isOmiAddressAtom('hello'));
    });

    it('returns false for numbers', () => {
      assert.ok(!isOmiAddressAtom('42'));
    });

    it('does not treat notation aliases as validated addresses', () => {
      assert.ok(!isOmiAddressAtom('omi-abc'));
      assert.ok(!isOmiAddressAtom('omi---imo'));
      assert.ok(!isOmiAddressAtom('imo-abc'));
      assert.ok(!isOmiAddressAtom('ffff-127-0-0-1/48'));
      assert.ok(isOmiAliasAtom('omi-abc'));
      assert.ok(isOmiAliasAtom('omi---imo'));
      assert.ok(isOmiAliasAtom('imo-abc'));
      assert.ok(!isOmiAliasAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128'));
    });
  });

  describe('isOmiAddressAtom — @ lens syntax (0xAD)', () => {
    it('detects address with /@60 lens', () => {
      assert.ok(isOmiAddressAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128/@60'));
    });
    it('detects address with stacked lenses', () => {
      assert.ok(isOmiAddressAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128/@60/@4'));
    });
    it('detects address with @ lens without CIDR', () => {
      assert.ok(isOmiAddressAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/@720'));
    });
    it('detects address with all lens types', () => {
      assert.ok(isOmiAddressAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/@60/@360/@720/@5040/@4/@5/@16'));
    });
    it('rejects bare / without number', () => {
      assert.ok(!isOmiAddressAtom('omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/'));
    });
  });

  describe('integration: O-expression with OMI addresses', () => {
    it('parses an O-expression with embedded OMI address', () => {
      const src = '(define generator omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128)';
      const expr = readOExpression(src);
      assert.strictEqual(expr.type, 'list');
      assert.strictEqual(expr.items.length, 3);
      assert.strictEqual(expr.items[1].type, 'atom');
      assert.strictEqual(expr.items[2].type, 'omi-address');
    });

    it('parses a nested structure matching the user example', () => {
      const src = '(generator . omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128)';
      const expr = readOExpression(src);
      assert.strictEqual(expr.type, 'pair');
      assert.strictEqual(expr.car.value, 'generator');
      assert.strictEqual(expr.cdr.type, 'omi-address');
    });
  });

  describe('integration: IMO payload block round-trip', () => {
    it('reads a RULES.imo-style block', () => {
      const block = [
        'ο !/65535-0-0-0-0-0-0-0/48 Ο',
        'ο !/927-0-0-0-0-0-0-0/48 Ο',
        'ο !/0-1-0-0-0-0-0-0/48 Ο'
      ].join('\n');
      const records = readImoPayloadBlock(block);
      assert.strictEqual(records.length, 3);
      for (const rec of records) {
        assert.strictEqual(rec.operator, '!');
        assert.ok(rec.address.includes('/'));
      }
    });

    it('reads a CLOSURES.imo-style block with source attachment', () => {
      const block = [
        'ο )/0-0-0-0-0-0-121-49153/128 Ο',
        'ο \x1e0-0-0-0-0-0-121-49153/128\x1f Ο',
        'ο )/0-0-0-0-0-0-20544-49154/128 Ο',
        'ο \x1e0-0-0-0-0-0-20544-49154/128\x1f Ο'
      ].join('\n');
      const records = readImoPayloadBlock(block);
      assert.strictEqual(records.length, 2);
      for (const rec of records) {
        assert.strictEqual(rec.operator, ')');
        assert.ok(rec.sourceAddress);
      }
    });
  });

  describe('edge cases', () => {
    it('handles multiple spaces between expressions', () => {
      const expr = readOExpression('(a    b)');
      assert.strictEqual(expr.items.length, 2);
    });

    it('handles newlines in lists', () => {
      const expr = readOExpression('(\na\nb\nc\n)');
      assert.strictEqual(expr.items.length, 3);
    });

    it('skips line comments', () => {
      const exprs = readOExpressionList('a ; comment\nb ; another\nc');
      assert.strictEqual(exprs.length, 3);
    });

    it('handles nested quoting', () => {
      const expr = readOExpression("''a");
      assert.strictEqual(expr.type, 'quoted');
      assert.strictEqual(expr.expr.type, 'quoted');
    });

    it('handles deep nesting', () => {
      const expr = readOExpression('(a (b (c (d e))))');
      assert.strictEqual(expr.type, 'list');
      assert.strictEqual(expr.items[1].items[1].items[1].items.length, 2);
    });

    it('returns null for null/undefined input', () => {
      assert.strictEqual(readOExpression(null), null);
      assert.strictEqual(readOExpression(undefined), null);
    });
  });

  describe('error messages', () => {
    it('includes line and column info in errors', () => {
      try {
        readOExpression('(\na\nb\n) )');
        assert.fail('Should have thrown');
      } catch (e) {
        assert.ok(e instanceof OExpressionSyntaxError);
        assert.ok(e.message);
      }
    });
  });
});
