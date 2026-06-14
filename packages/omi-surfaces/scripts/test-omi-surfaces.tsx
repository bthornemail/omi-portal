import { strict as assert } from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  base64ToBytes,
  createAcceptedOmiWorker,
  createOmiCarrier,
  deriveOmiCarrierHash,
  modemFrameToOmiCarrier,
  OmiGnomon,
  OmiMatrix,
  OmiSurface,
  OmiWorkerSurface,
  omiCarrierDataAttributes,
  textToBase64,
} from '../src';

async function run() {
  const base64 = textToBase64('omi surface carrier');
  const bytes = base64ToBytes(base64);
  assert.equal(new TextDecoder().decode(bytes), 'omi surface carrier');

  const carrier = createOmiCarrier({
    id: 'carrier-1',
    address: 'o---o/---/?v=test;l=4;h=hash@3C@',
    surface: 'matrix',
    receiptState: 'candidate',
    mime: 'application/octet-stream',
    base64,
    oWord: '0x1234',
  });

  const hashA = await deriveOmiCarrierHash(carrier);
  const hashB = await deriveOmiCarrierHash(carrier);
  assert.equal(hashA, hashB);
  assert.match(hashA, /^[0-9a-f]{64}$/);

  const attrs = omiCarrierDataAttributes({ ...carrier, hash: hashA }, 'gnomon');
  assert.equal(attrs['data-omi'], carrier.address);
  assert.equal(attrs['data-imo'], 'o---o/---/?receipt=candidate@3C@');
  assert.equal(attrs['data-omi-surface'], 'gnomon');
  assert.equal(attrs['data-receipt-state'], 'candidate');
  assert.equal(attrs['data-o-word'], '0x1234');
  assert.equal(attrs['data-carrier-hash'], hashA);

  assert.throws(() => createAcceptedOmiWorker(carrier), /Cannot execute unaccepted/);
  assert.throws(() => createAcceptedOmiWorker({ ...carrier, receiptState: 'rejected' }), /Cannot execute unaccepted/);

  const surfaceHtml = renderToStaticMarkup(
    <OmiSurface carrier={carrier} surface="matrix">
      <span>matrix</span>
    </OmiSurface>,
  );
  assert.match(surfaceHtml, /data-omi-surface="matrix"/);
  assert.match(surfaceHtml, /data-receipt-state="candidate"/);

  const directHtml = renderToStaticMarkup(
    <OmiGnomon
      address="o---o/---/?v=gnomon;l=6;h=axis;b=beta1;s={4,3}@3C@"
      receiptState="candidate"
    >
      Orientation axis
    </OmiGnomon>,
  );
  assert.match(directHtml, /data-omi-surface="gnomon"/);
  assert.match(directHtml, /data-omi="o---o\/---\/\?v=gnomon;l=6;h=axis;b=beta1;s=\{4,3\}@3C@"/);

  const namedHtml = renderToStaticMarkup(
    <OmiMatrix carrier={carrier}>
      <span>named</span>
    </OmiMatrix>,
  );
  assert.match(namedHtml, /Omi-Matrix/);
  assert.match(namedHtml, /data-omi-surface="matrix"/);

  const workerHtml = renderToStaticMarkup(<OmiWorkerSurface carrier={carrier} />);
  assert.match(workerHtml, /disabled=""/);
  assert.match(workerHtml, /Activate OMI Worker/);

  const frameCarrier = modemFrameToOmiCarrier({
    frame: {
      event: { id: 'event-1', name: 'passes', status: 'passed' },
      address: 'omi-0000-0000-0000-0000-0000-0000-0001-0001/128',
      receiptState: 'accepted',
      slot5040: 720,
    },
    oWordHex: 'abcd'.repeat(16),
    oFile: 'abcd'.repeat(16),
  });
  assert.equal(frameCarrier.id, 'tetragrammatron:event-1');
  assert.equal(frameCarrier.receiptState, 'accepted');
  assert.equal(frameCarrier.oWord, 'abcd'.repeat(16));
  assert.equal(new TextDecoder().decode(base64ToBytes(frameCarrier.base64)), 'abcd'.repeat(16));

  console.log('PASS: @omi/surfaces');
}

run().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
