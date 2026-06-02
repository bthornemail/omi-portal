#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { compileOmiFile } from '../src/omilog/omi-imo-compiler.js';

const [,, source, target] = process.argv;

if (!source || !target) {
  console.error('Usage: node scripts/compile-omi.js <source.omi> <target.imo>');
  process.exit(1);
}

if (!existsSync(source)) {
  console.error(`Error: source file not found: ${source}`);
  process.exit(1);
}

try {
  const text = readFileSync(source, 'utf-8');
  const result = await compileOmiFile(text, { source });
  writeFileSync(target, result.imoText, 'utf-8');
  console.log(`Compiled: ${source} → ${target} (${result.lines.length} records)`);
} catch (err) {
  console.error(`Error compiling ${source}: ${err.message}`);
  process.exit(1);
}
