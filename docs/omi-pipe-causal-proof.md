# OMI Pipe — Causal Proof Layer

## 1. Purpose

`omi-pipe-causal-proof` adds causal proof validation to the OMI acceptance layer.

A reconstruction candidate can be accepted only when its declared dependency vectors are less than or equal to its candidate version vector.

## 2. Existing Branch Stack

1. `omi-pipe-posix` — same frame produces the same receipt
2. `omi-pipe-network-vectors` — transport changes; receipt does not
3. `omi-pipe-mcrsgsp-carrier` — MCRSGSP messages ride inside CAR/CDR/CID
4. `omi-pipe-mcrsgsp-reconstruction` — k-of-n fragment streams produce candidates
5. `omi-pipe-omi-acceptance` — valid candidates become accepted OMI receipts
6. `omi-pipe-causal-proof` — accepted receipts require causal closure proof

## 3. Candidate vs Accepted Boundary

Recoverability is not acceptance. A candidate receipt proves that enough fragments were observed to produce a candidate root. An accepted receipt proves OMI authority over that candidate.

The updated chain is:

```
fragments
→ carrier frames
→ reconstruction candidate
→ candidate-root validation
→ causal closure proof
→ accepted receipt
```

## 4. Why Causal Closure Is Required

Candidate shape, candidate root, and witness shape do not prove that the candidate contains the dependencies it claims to close. The CDR surface therefore carries the causal proof root, while query fields carry the deterministic proof material used by this branch.

For `t=omi-accept-candidate`:

```
cdr=<proof-root>
proof=<canonical-proof-string>
vv=<candidate-version-vector>
requires=<dependency-vector-list>
```

## 5. Version-Vector Grammar

A version vector is:

```
peer:counter,peer:counter,...
```

Canonical rules:

- peer keys are sorted lexicographically
- no whitespace
- counters are decimal non-negative integers
- duplicate peers are rejected
- malformed counters are rejected
- zero counters should be omitted unless required by an adapter

Example:

```
nodeA:3,nodeB:2,nodeC:1
```

## 6. Dependency Proof Grammar

`requires=` is a `|` separated list of version vectors:

```
requires=nodeA:1,nodeB:2|nodeA:2,nodeB:2
```

Each dependency vector follows the same canonical vector grammar.

## 7. Closure Predicate

Partial order:

```
V <= W iff for every peer p, V[p] <= W[p]
```

Causal closure:

```
candidate is causally closed iff every required dependency vector D satisfies D <= candidate_vv
```

## 8. Receipt Formats

Accepted:

```
omi-receipt:accepted;type=omi-accepted-candidate;id=<id>;k=<k>;n=<n>;subset=<subset>;candidate-root=<root>;vv=<vv>;causal=closed;scope=0x7c00;accept-seal=0xaa55
```

Reject:

```
omi-reject:causal-proof-not-closed;type=omi-accept-candidate;id=<id>;missing=<dep>;vv=<vv>;scope=0x7c00
```

Malformed proof reject:

```
omi-reject:malformed-version-vector;type=omi-accept-candidate;id=<id>;scope=0x7c00
```

Missing proof reject:

```
omi-reject:missing-causal-proof;type=omi-accept-candidate;id=<id>;scope=0x7c00
```

## 9. Failure Modes

Reject:

- `missing-version-vector`
- `malformed-version-vector`
- `version-vector-not-sorted`
- `duplicate-version-vector-peer`
- `negative-version-counter`
- `missing-causal-proof`
- `malformed-dependency-vector`
- `dependency-vector-not-sorted`
- `duplicate-dependency-peer`
- `causal-proof-not-closed`

Repair:

- `cid-mismatch`

This branch preserves the existing acceptance convention that CID mismatch repairs before causal proof validation.

## 10. Test Vectors

| Vector | Expected |
|--------|----------|
| `accept-causal-closed-basic` | accepted, `causal=closed` |
| `accept-causal-closed-multiple-deps` | accepted, `causal=closed` |
| `reject-missing-vv` | reject, `missing-version-vector` |
| `reject-malformed-vv` | reject, `malformed-version-vector` |
| `reject-dependency-not-covered` | reject, `causal-proof-not-closed` |
| `reject-unsorted-vv` | reject, `version-vector-not-sorted` |
| `repair-causal-cid-mismatch` | repair, `cid-mismatch` |

## 11. Canon

OmiPipe may accept a reconstruction candidate only when its candidate-root, sorted subset, CAR/CDR/CID witness, acceptance seal, and causal closure proof all validate; otherwise the candidate remains recoverable but not accepted.
