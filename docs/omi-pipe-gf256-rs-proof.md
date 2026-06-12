# OMI Pipe - GF(256) RS Proof Layer

## 1. Purpose

`omi-pipe-gf256-rs-proof` adds a real finite-field reconstruction proof mode to OmiPipe candidate acceptance.

The GF(256) RS proof validates that the declared subset is algebraically sufficient to replay the candidate-root; it does not make transport or reconstruction candidates authoritative by themselves.

## 2. Existing Proven Stack

1. `omi-pipe-posix` - same frame produces the same receipt
2. `omi-pipe-network` - transport changes, receipt does not
3. `omi-pipe-mcrsgsp-carrier` - fragment/frontier/request/candidate messages ride inside OmiPipe
4. `omi-pipe-mcrsgsp-reconstruction` - k-of-n fragment streams produce candidates
5. `omi-pipe-omi-acceptance` - candidate shape can become an accepted receipt
6. `omi-pipe-causal-proof` - accepted receipt requires causal closure
7. `omi-pipe-rs-proof` - accepted receipt requires replayable fragment-root proof using `rs=xor`
8. `omi-pipe-gf256-rs-proof` - accepted receipt can require GF(256) interpolation replay using `rs=gf256`

## 3. Why `rs=xor` Was Placeholder

`rs=xor` proves deterministic replay shape:

```text
subset + fragment roots -> replay root
```

It is useful for plumbing and receipt determinism, but it is not Reed-Solomon reconstruction.

## 4. Why `rs=gf256` Is Next

`rs=gf256` moves the proof from placeholder replay to finite-field interpolation. Acceptance checks that the selected fragment roots can replay the declared candidate-root under a Reed-Solomon-style basis.

## 5. GF(256) Field Definition

The field is:

```text
GF(2^8)
primitive polynomial: 0x11d
```

Addition is XOR. Multiplication uses bitwise reduction by `0x1d`, the low byte of `0x11d`.

## 6. `root16` Layout

`layout=root16` interprets each 16-bit root as two GF(256) symbols:

```text
0x2003 -> [0x20, 0x03]
```

Replay runs independently over the high and low bytes, then recomposes:

```text
candidate-root = (candidate_high << 8) | candidate_low
```

## 7. Lagrange Interpolation At `x=0`

Each fragment root is a point:

```text
x = idx + 1
y = root byte
```

`x=0` is reserved for the candidate-root evaluation. For each byte lane:

```text
candidate_byte = sum(y_i * L_i(0))
L_i(0) = product(x_j) / product(x_i ^ x_j)
```

Subtraction equals addition in GF(256), so denominator terms use `x_i ^ x_j`.

## 8. Subset And Basis Rule

The declared subset must be sorted, unique, in range, and contain at least `k` entries.

When `subset_count > k`, this branch uses the first `k` sorted subset indices as the replay basis. Future branches may validate every k-combination for consistency.

## 9. Receipt Formats

Accepted:

```text
omi-receipt:accepted;type=omi-accepted-candidate;id=<id>;k=<k>;n=<n>;subset=<subset>;candidate-root=0x<root>;rs=gf256;gf=0x11d;layout=root16;rs-proof=replayed;vv=<vv>;causal=closed;scope=0x7c00;accept-seal=0xaa55
```

Reject mismatch:

```text
omi-reject:gf256-rs-proof-mismatch;type=omi-accept-candidate;id=<id>;expected=0x<declared>;actual=0x<replayed>;scope=0x7c00
```

Repair remains the CAR/CDR/CID repair path:

```text
omi-repair:cid-mismatch;type=omi-accept-candidate;id=<id>;car=<car>;cdr=<cdr>;cid=<cid>;expected-cid=<expected>;scope=0x7c00
```

## 10. Failure Modes

Reject:

- `missing-rs-proof`
- `unsupported-rs-mode`
- `unsupported-gf-polynomial`
- `unsupported-rs-layout`
- `malformed-frag-root`
- `duplicate-frag-index`
- `frag-index-out-of-range`
- `missing-frag-for-subset-index`
- `rs-subset-less-than-k`
- `gf256-rs-proof-mismatch`
- `gf256-zero-denominator`

Repair:

- `cid-mismatch`

## 11. Fixtures

Fixtures live in:

```text
test/pipe-gf256-rs-proof/
```

Candidate roots are generated with:

```text
scripts/pipe/gf256-root.js
```

The generator mirrors the C GF(256) multiply, inverse, division, and interpolation rules.

## 12. Canon

OmiPipe may carry fragments and produce reconstruction candidates, but OMI acceptance may only accept a candidate when the declared subset is RS-sufficient, the fragment roots replay the candidate-root under the declared proof mode, the causal proof is closed, the CAR/CDR/CID witness validates, and the acceptance seal holds.
