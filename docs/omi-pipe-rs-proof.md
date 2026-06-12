# OMI Pipe — RS Proof Layer

## 1. Purpose

`omi-pipe-rs-proof` adds deterministic reconstruction proof replay above causal proof.

A candidate-root is acceptable only when the declared subset and fragment roots replay the same root under the declared reconstruction proof mode.

## 2. Existing Stack

1. `omi-pipe-posix` — same frame produces the same receipt
2. `omi-pipe-network-vectors` — transport changes; receipt does not
3. `omi-pipe-mcrsgsp-carrier` — MCRSGSP messages ride inside CAR/CDR/CID
4. `omi-pipe-mcrsgsp-reconstruction` — k-of-n fragment streams produce candidates
5. `omi-pipe-omi-acceptance` — valid candidates become accepted OMI receipts
6. `omi-pipe-causal-proof` — accepted receipts require causal closure proof
7. `omi-pipe-rs-proof` — accepted receipts require candidate-root replay from declared fragments

## 3. Candidate-Root Replay

Candidate-root replay binds an acceptance frame back to the fragment roots it claims as its reconstruction subset.

The current branch does not implement full Reed-Solomon decoding. It proves the deterministic replay surface:

```
subset + fragment roots + rs mode -> replay root
```

The replay root must equal `candidate-root`.

## 4. RS-Sufficient Subset Proof

For `t=omi-accept-candidate`, acceptance now requires:

```
subset=<indices>
frags=<idx:root,...>
rs=xor
candidate-root=<root>
```

Every index listed in `subset` must have a matching fragment root in `frags`.

## 5. frags= Grammar

The canonical fragment-root list is:

```
frags=0:2000,1:2001,2:2002
```

Rules:

- entries are comma separated
- each entry is `idx:hex-root`
- `idx` is a decimal fragment index
- `hex-root` is one to eight hexadecimal nibbles
- duplicate fragment indices are rejected
- malformed entries are rejected
- subset indices without a fragment root are rejected

## 6. rs= Modes

This branch supports:

```
rs=xor
```

Replay:

```
0x2000 ^ 0x2001 ^ 0x2002 = 0x2003
```

Future branches may add:

```
rs=gf256
```

`gf256` is not accepted by this branch.

## 7. Acceptance Predicates

The acceptance layer checks:

1. valid frame
2. valid scale `0x3F`
3. valid pipe scope
4. valid candidate type
5. valid `k` and `n`
6. valid sorted subset
7. subset count `>= k`
8. `candidate-root` present
9. RS proof present
10. every subset index has a fragment root
11. no malformed fragment entries
12. replay root equals `candidate-root`
13. valid candidate version vector
14. every dependency vector is `<=` candidate version vector
15. valid CAR/CDR/CID witness
16. valid seal

## 8. Receipt Formats

Accepted:

```
omi-receipt:accepted;type=omi-accepted-candidate;id=<id>;k=<k>;n=<n>;subset=<subset>;candidate-root=<root>;rs=xor;rs-proof=replayed;vv=<vv>;causal=closed;scope=0x7c00;accept-seal=0xaa55
```

Reject:

```
omi-reject:rs-proof-mismatch;type=omi-accept-candidate;id=<id>;expected=<candidate-root>;actual=<replay-root>;scope=0x7c00
```

Missing proof:

```
omi-reject:missing-rs-proof;type=omi-accept-candidate;id=<id>;scope=0x7c00
```

Repair:

```
omi-repair:cid-mismatch;type=omi-accept-candidate;id=<id>;car=<car>;cdr=<cdr>;cid=<cid>;expected-cid=<expected>;scope=0x7c00
```

## 9. Failure Modes

Reject:

- `missing-rs-proof`
- `unsupported-rs-mode`
- `malformed-frag-root`
- `duplicate-frag-index`
- `frag-index-out-of-range`
- `frag-missing-subset-index`
- `rs-proof-mismatch`

Repair:

- `cid-mismatch`

This branch validates RS replay before causal proof and before final CAR/CDR/CID witness repair.

## 10. Test Vectors

| Vector | Expected |
|--------|----------|
| `accept-rs-basic` | accepted, `rs-proof=replayed` |
| `accept-rs-3-of-5` | accepted, `rs-proof=replayed` |
| `reject-missing-frags` | reject, `missing-rs-proof` |
| `reject-frag-missing-subset-index` | reject, `frag-missing-subset-index` |
| `reject-frag-extra-malformed` | reject, `malformed-frag-root` |
| `reject-rs-root-mismatch` | reject, `rs-proof-mismatch` |
| `repair-rs-cid-mismatch` | repair, `cid-mismatch` |

## 11. Canon

OmiPipe may carry fragments and produce reconstruction candidates, but OMI acceptance may only accept a candidate when its subset, fragment roots, candidate-root replay, causal proof, CAR/CDR/CID witness, and seal all validate.
