export function cla4(A, B, Cin = 0) {
  A &= 0xF; B &= 0xF; Cin &= 1;
  const P = [0, 1, 2, 3].map((i) => ((A >> i) & 1) ^ ((B >> i) & 1));
  const G = [0, 1, 2, 3].map((i) => ((A >> i) & 1) & ((B >> i) & 1));
  const C0 = G[0] | (P[0] & Cin);
  const C1 = G[1] | (P[1] & G[0]) | (P[1] & P[0] & Cin);
  const C2 = G[2] | (P[2] & G[1]) | (P[2] & P[1] & G[0]) | (P[2] & P[1] & P[0] & Cin);
  const C3 = G[3] | (P[3] & G[2]) | (P[3] & P[2] & G[1]) | (P[3] & P[2] & P[1] & G[0]) | (P[3] & P[2] & P[1] & P[0] & Cin);
  return {
    P,
    G,
    carries: [Cin, C0, C1, C2, C3],
    S: [P[0] ^ Cin, P[1] ^ C0, P[2] ^ C1, P[3] ^ C2],
    Cout: C3
  };
}

export function bitsToNibble(bits) {
  return bits.reduce((acc, bit, i) => acc | ((bit & 1) << i), 0) & 0xF;
}
