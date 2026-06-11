# OMI Pipe — OMI Acceptance Layer

## 1. Purpose

Prove that a reconstruction candidate produced by MCRSGSP can be passed into the OMI validation layer and converted into an accepted OMI receipt only when all authority predicates pass.

The boundary remains:
```
omi-receipt:candidate ≠ omi-receipt:accepted
```

Reconstruction proves recoverability. Acceptance proves OMI authority.

## 2. Existing Checkpoints

1. `omi-pipe-posix` — same frame → same receipt
2. `omi-pipe-network-vectors` — transport changes; receipt does not
3. `omi-pipe-mcrsgsp-carrier` — storage messages ride the pipe
4. `omi-pipe-mcrsgsp-reconstruction` — k-of-n fragment streams produce candidates

5. `omi-pipe-omi-acceptance` — reconstruction candidates become accepted OMI state only after validation

## 3. Candidate vs Accepted Boundary

```
fragment observed → fragment carried → fragment tracked
→ k-of-n candidate emitted → OMI validation → accepted receipt
```

Doctrine: Recovery is not acceptance. Transport is not acceptance.
Candidate is not acceptance. Receipt after OMI validation is acceptance.

## 4. Input Frame Grammar

```
omi-0000-0035/001c/003f/007c/0055-imo?t=omi-accept-candidate
  ;id=<codeword>
  ;k=<k>;n=<n>
  ;subset=<indices>
  ;candidate-root=<root>
  ;car=<car>;cdr=<cdr>;cid=<cid>
```

## 5. Acceptance Predicates

1. frame grammar valid
2. OmiPipe scope valid
3. Omi-Nomogram scale valid
4. candidate type valid (`t=omi-accept-candidate`)
5. `id` present
6. `k` present, non-negative
7. `n` present, non-negative, `n ≤ 64`
8. `k ≤ n`
9. `subset` present, sorted ascending, unique, all indices `0 ≤ idx < n`
10. `subset` count `≥ k`
11. `candidate-root` present
12. CAR/CDR/CID witness valid (`car ^ cdr == cid`)

## 6. CAR/CDR/CID Witness Rule

For acceptance frames:
- CAR = candidate-root (candidate content root)
- CDR = causal proof root / subset proof / frontier root
- CID = CAR XOR CDR

Example:
```
candidate-root = 0x2003
cdr            = 0x4000
cid            = 0x6003  (2003 ^ 4000)
```

## 7. Candidate-Root Binding

The acceptance frame carries `candidate-root=<root>` and validates it through CAR/CDR/CID witness. The reconstruction layer already proved the root; acceptance binds it into OMI receipt authority.

## 8. Receipt Formats

Accepted:
```
omi-receipt:accepted;type=omi-accepted-candidate;id=<id>;k=<k>;n=<n>
  ;subset=<subset>;candidate-root=<root>;scope=0x7c00;accept-seal=0xaa55
```

Reject:
```
omi-reject:<reason>;type=omi-accept-candidate;id=<id>;scope=0x7c00
```

Repair:
```
omi-repair:cid-mismatch;type=omi-accept-candidate;id=<id>;car=0x<car>
  ;cdr=0x<cdr>;cid=0x<cid>;expected-cid=0x<expected>;scope=0x7c00
```

## 9. Failure Modes

| Mode | Reason |
|------|--------|
| Reject | missing-candidate-root |
| Reject | missing-id |
| Reject | missing-k |
| Reject | missing-n |
| Reject | k-greater-than-n |
| Reject | missing-subset |
| Reject | invalid-subset-idx |
| Reject | subset-not-sorted |
| Reject | subset-below-k |
| Reject | missing-car-cdr-cid |
| Reject | reconstruction-type-in-query |
| Repair | cid-mismatch |

## 10. Test Vectors

| Vector | Scenario | Expected |
|--------|----------|----------|
| `accept-candidate-basic` | valid k=2, subset=0,1, root=0x0001 | accepted |
| `accept-candidate-3-of-5` | valid k=3, subset=0,1,2, root=0x2003 | accepted |
| `reject-candidate-missing-root` | no candidate-root field | reject (missing-candidate-root) |
| `reject-candidate-bad-subset` | subset=0,2,1 not sorted | reject (subset-not-sorted) |
| `reject-candidate-subset-less-than-k` | k=3, subset has only 2 indices | reject (subset-below-k) |
| `repair-candidate-cid-mismatch` | cid=ffff ≠ car^cdr | repair (expected-cid=0x4001) |
| `reject-reconstruction-output-type` | t=mcrsgsp-reconstruction input | reject (reconstruction-type-in-query) |

## 11. Canon

OmiPipe reconstruction produces candidates; OMI acceptance validates candidate-root, subset, witness, scope, scale, and seal before emitting an accepted receipt. The candidate receipt proves recoverability; the accepted receipt proves OMI authority.
