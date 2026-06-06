# OMI Distributed Protocol Prospectus

This prospectus extends the canonical OMI Object Model with distributed storage and propagation semantics. It is a documentation specification: a claim is implemented only when the matching source module and test exist locally.

## Address And Projection Boundary

OMI maps IPv6-style prefix containment onto the 8-segment pointer form:

```text
omi-<s0>-<s1>-<s2>-<s3>-<s4>-<s5>-<s6>-<s7>/<prefix>
```

For a fixed prefix length, subnets are disjoint or nested. Browser projection follows the same rule by using the pointer as an `id` and matching with id-based CSSOM selectors:

```css
[id^="omi-"] {}
[id*="-02d0-"] {}
```

The canonical local context boundary remains:

```text
::ffff:127.0.0.1 -> omi-ffff-127-0-0-1
```

## MCRSGSP Provenance

The Monotone Causal Reed-Solomon Gossip Storage Protocol (MCRSGSP) draft in `dev-docs/_temp/` is research provenance, not a canonical runtime by itself. OMI promotes only the parts that are represented by local source and tests:

| Draft concept | Canonical local carrier |
| --- | --- |
| Reed-Solomon recoverability | `src/distributed/erasure.js` |
| Immutable fragment storage | `src/distributed/fragment-store.js` |
| Causal admissibility | `src/distributed/causal-closure.js` |
| Version-vector ordering | `src/distributed/version-vector.js` |
| Epidemic propagation | `src/distributed/gossip.js` |
| Anti-entropy repair | `src/distributed/anti-entropy.js` |

Any WAN deployment, consensus-free cluster rollout, or transport-specific behavior is aspirational unless it is covered by a local test.

MCRSGSP is OMI's coordination-free gossip storage substrate: it lets fragments propagate, repair, and reconstruct without consensus, while leaving canonical acceptance to the OMI validation and receipt pipeline.

```text
Gossip moves.
Reed-Solomon recovers.
Causality bounds.
OMI accepts.
Projection displays.
```

Authority boundary:

```text
MCRSGSP provides recoverable candidates.
OMI decides accepted objects.
```

MCRSGSP moves fragments, preserves causal admissibility, repairs missing pieces, and reconstructs candidates. It does not decide final truth.

## Distributed State Rules

Remote OMI state is fragment-oriented:

```text
codeword identity
fragment index
RS(k,n) parameters
version vector
payload fragment
```

Fragments are immutable after generation. Any `k` of `n` RS fragments may reconstruct a candidate only when the selected fragment set is causally closed.

Distributed state grows monotonically. New fragments may expand the set of derivable candidates, but they must not invalidate previously derivable candidates. Local 720/5040 memory sweeps do not destroy distributed fragment state.

The authority path remains:

```text
fragment gossip
  -> causal closure
  -> RS-sufficient reconstruction
  -> candidate materialization
  -> OMI validation / resolution / receipt
```

## Implementation Gate

The distributed prospectus is considered aligned when the local suite proves:

```text
RS decode succeeds with any sufficient fragment subset.
Reconstruction rejects insufficient or causally open subsets.
Gossip exchanges missing fragments without a coordinator.
Anti-entropy repair reports missing inventories from version-vector frontiers.
```

This prospectus is represented structurally in `docs/10-declaration/omi-object-model.manifest.json`.
