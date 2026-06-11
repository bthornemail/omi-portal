# OMI Pipe — MCRSGSP Reconstruction Layer

## Layer Boundary

The reconstruction layer sits on top of the MCRSGSP carrier. It is:

- **Stateless per invocation**: each pipe run is a fresh reconstruction session. No persistence across runs.
- **Per-codeword tracking**: fragments are grouped by `id+k+n` (the codeword triple). Up to 8 concurrent codewords tracked.
- **Read-only on carrier**: reconstruction observes fragment receipts; it does not modify them. Receipt authority stays in the pipe gate.

## Candidate Detection

When k distinct fragments have been received for the same `id+k+n`, the reconstruction layer emits:

```
omi-receipt:candidate;type=mcrsgsp-reconstruction;id=<id>;k=<k>;n=<n>;subset=<indices>;candidate-root=<root>;scope=0x7c00
```

- `subset`: comma-separated sorted indices of collected fragments
- `candidate-root`: XOR aggregate of all fragment `car` values (deterministic, no external crypto)

## Receipt Order

When a fragment receipt triggers threshold, the candidate receipt appears **after** the fragment receipt:

```
omi-receipt:accepted;...;type=mcrsgsp-frag;id=X;idx=1
omi-receipt:candidate;type=mcrsgsp-reconstruction;id=X;k=2;subset=0,1;candidate-root=0x0001
omi-receipt:accepted;...;type=mcrsgsp-frag;id=X;idx=2
```

## Constraints

- `omi-receipt:candidate` is **not** `omi-receipt:accepted`. Reconstruction creates candidates; OMI acceptance is a higher authority layer.
- The reconstruction type `mcrsgsp-reconstruction` is reserved for output only — input frames with `t=mcrsgsp-reconstruction` are rejected.
- Duplicate fragment indices do not increase the count.
- Maximum 64 indices per codeword (uint64_t bitmask).
- Maximum 8 concurrent codeword slots.

## Test Vectors

| Vector | Scenario | Expected |
|--------|----------|----------|
| `reconstruct-sequential-stream` | 3 fragments idx=0,1,2 (k=3,n=5); candidate on 3rd | 3 accept + 1 candidate (subset=0,1,2, root=0x2003) |
| `reconstruct-duplicate-idx` | duplicate idx=0 does not increase unique count | 3 accept + 1 candidate (subset=0,1, root=0x0002) |
| `reconstruct-insufficient` | only 2 of 3 unique fragments (k=3,n=5) | 2 accept + 0 candidates |
| `reconstruct-frontier-candidate` | frontier + 2 fragments (k=2,n=3); frontier does not participate in count | 3 accept + 1 candidate (subset=0,1, root=0x0001) |
| `reject-reconstruction-input-type` | `t=mcrsgsp-reconstruction` input rejected | 0 accept + 1 reject (reconstruction-type-in-query) |

## Scale

All MCRSGSP reconstruction frames use scale `0x3F` (lfsr-period, Omi-Nomogram).
