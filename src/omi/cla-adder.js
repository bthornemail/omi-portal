export function computeCla4Bit(A, B, Cin) {
  const P = (A ^ B) & 0x0F;
  const G = (A & B) & 0x0F;

  const p0 = (P >> 0) & 1, p1 = (P >> 1) & 1, p2 = (P >> 2) & 1, p3 = (P >> 3) & 1;
  const g0 = (G >> 0) & 1, g1 = (G >> 1) & 1, g2 = (G >> 2) & 1, g3 = (G >> 3) & 1;

  const C1 = g0 | (p0 & Cin);
  const C2 = g1 | (p1 & g0) | (p1 & p0 & Cin);
  const C3 = g2 | (p2 & g1) | (p2 & p1 & g0) | (p2 & p1 & p0 & Cin);
  const C4 = g3 | (p3 & g2) | (p3 & p2 & g1) | (p3 & p2 & p1 & g0) | (p3 & p2 & p1 & p0 & Cin);

  const S0 = p0 ^ Cin;
  const S1 = p1 ^ C1;
  const S2 = p2 ^ C2;
  const S3 = p3 ^ C3;

  const sum = (S3 << 3) | (S2 << 2) | (S1 << 1) | S0;

  const PG = p0 & p1 & p2 & p3;
  const GG = g3 | (g2 & p3) | (g1 & p3 & p2) | (g0 & p3 & p2 & p1);

  return {
    P, G,
    carries: [C1, C2, C3, C4],
    sum,
    Cout: C4,
    PG, GG,
    gateDelays: { step0: 1, carry: 3, sum: 4 },
    sumBits: [S0, S1, S2, S3]
  };
}

export function computeCla16Bit(A, B, Cin) {
  const groupCarryIn = [
    { A: (A >> 0) & 0x0F, B: (B >> 0) & 0x0F },
    { A: (A >> 4) & 0x0F, B: (B >> 4) & 0x0F },
    { A: (A >> 8) & 0x0F, B: (B >> 8) & 0x0F },
    { A: (A >> 12) & 0x0F, B: (B >> 12) & 0x0F }
  ];

  const groupResults = groupCarryIn.map(g => computeCla4Bit(g.A, g.B, 0));
  const PGs = groupResults.map(r => r.PG);
  const GGs = groupResults.map(r => r.GG);

  const lcuCarries = [Cin];
  for (let i = 0; i < 4; i++) {
    const carry = GGs[i];
    let term = PGs[i] & lcuCarries[i];
    lcuCarries.push(carry | term);
  }

  const finalGroups = groupCarryIn.map((g, i) => computeCla4Bit(g.A, g.B, lcuCarries[i]));

  const sum = finalGroups.reduce((acc, r, i) => acc | (r.sum << (i * 4)), 0);
  const Cout = lcuCarries[4];

  return { sum, Cout, groupResults: finalGroups, lcuCarries };
}
