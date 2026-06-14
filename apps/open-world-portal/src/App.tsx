import React from 'react';
import { OmiGnomon, OmiMatrix, OmiPortal, OmiWorld } from '@omi/surfaces';

export function App() {
  return (
    <main className="open-world-shell">
      <header className="portal-heading">
        <p className="eyebrow">Open World Portal</p>
        <h1>Canonical Projection Surface</h1>
      </header>

      <OmiPortal
        address="o---o/---/?v=open-world;l=10;h=portal;b=beta1;s={4,3}@3C@"
        receiptState="candidate"
        className="portal-boundary"
      >
        <OmiWorld
          address="o---o/---/?v=world;l=5;h=root;b=beta1;s={4,3}@3C@"
          receiptState="candidate"
          className="world-frame"
        >
          <OmiMatrix
            address="o---o/---/?v=matrix;l=6;h=field;b=beta1;s={4,3}@3C@"
            receiptState="candidate"
          >
            Observation field
          </OmiMatrix>

          <OmiGnomon
            address="o---o/---/?v=gnomon;l=6;h=axis;b=beta1;s={4,3}@3C@"
            receiptState="candidate"
          >
            Orientation axis
          </OmiGnomon>
        </OmiWorld>
      </OmiPortal>
    </main>
  );
}
