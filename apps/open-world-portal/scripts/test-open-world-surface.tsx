import { strict as assert } from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/App';

const html = renderToStaticMarkup(<App />);

assert.match(html, /Open World Portal/);
assert.match(html, /data-omi-surface="portal"/);
assert.match(html, /data-omi-surface="world"/);
assert.match(html, /data-omi-surface="matrix"/);
assert.match(html, /data-omi-surface="gnomon"/);
assert.match(html, /data-receipt-state="candidate"/);
assert.match(html, /o---o\/---\/\?v=open-world;l=10;h=portal;b=beta1;s=\{4,3\}@3C@/);

console.log('PASS: open-world-portal surface smoke');
