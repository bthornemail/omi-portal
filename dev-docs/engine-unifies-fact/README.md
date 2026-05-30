# Face 7 — engine unifies fact

**Inference Mesh — OmiPrologInferenceEngine Zero-Allocation Unifications**

## 🟢 What

The inference mesh brings **symbolic reasoning** to the OMI protocol. Every committed receipt in the atomic ledger can be queried as a Prolog fact — the engine unifies logical queries against the ring buffer using branchless, zero-allocation search over the Fano 7-point relation space.

Two modes of unification are supported:

1. **Direct identity** — does slot (LL, NN, MM) match exactly? (proven in 0 steps)
2. **Transitive Horn clause** — can we chain through Fano relations to derive the query? (proven in k ≤ 14 steps)

The relation space uses WordNet semantic roles projected onto the 7 Fano points:

| Fano Point | Relation |
|------------|----------|
| 1 | hypernym (is-a) |
| 2 | hyponym (kind-of) |
| 3 | holonym (part-of) |
| 4 | meronym (has-part) |
| 5 | antonym (opposite) |
| 6 | entailment (implies) |
| 7 | troponym (manner) |

Each lemma in the vocabulary maps to a **10-slot relation centroid** vector, stored alongside its HNSW embedding for approximate nearest-neighbor search.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/prolog-inference.js` | `OmiPrologInferenceEngine` — zero-allocation unification, direct identity + transitive Horn clause resolution |
| `src/omi/fano-prolog.js` | Fano token parse/format, service bus routing (::1..::12), binary packet serialization |
| `src/omi/axiomatic-kernel.js` | `OmiAxiomaticKernel` — loads RULES.omi / FACTS.omi and .pl Prolog files, segment-based fact query |
| `src/wordnet/prolog-broker.js` | `PrologWordNetBroker` — loads WordNet Prolog facts, `lookup(lemma)` returns synset, `parsePrologFacts()` |
| `src/wordnet/relation-space.js` | `makeWordNetCentroid()` — 10-slot relation vector, `cidrMetric()` — stability = count/minRelations |
| `src/web/semantic-memory-broker.js` | `OmiSemanticMemoryBroker` — bridges Prolog broker + HNSW index for nearest-neighbor search |

### Zero-allocation unification

```javascript
export class OmiPrologInferenceEngine {
  unifySymbolicQuery(LL, NN, MM) {
    // Step 1: Direct identity — scan ring for exact (LL, NN, MM)
    const directMatch = this._scanIdentity(LL, NN, MM);
    if (directMatch >= 0) return { status: "DIRECT_IDENTITY_PROVEN", slot: directMatch };

    // Step 2: Transitive Horn clause — chain through Fano lines
    const hornResult = this._resolveTransitive(LL, NN, MM);
    if (hornResult.proven) return { status: "TRANSITIVE_HORN_CLAUSE_PROVEN", steps: hornResult.steps };

    return { status: "NON_UNIFIABLE" };
  }

  _resolveTransitive(LL, NN, MM) {
    // Walk the Fano 7-point relation graph, chaining through
    // intermediate (LL', NN', MM') triples stored in the ring.
    // Uses only Atomics.load on BigInt64Array — zero allocations.
    for (let depth = 1; depth <= 14; depth++) {
      // ... branchless scan over 5040 slots ...
      if (found) return { proven: true, steps: depth };
    }
    return { proven: false };
  }
}
```

### WordNet centroid

```javascript
function makeWordNetCentroid(lemma, relations) {
  return {
    lemma,
    vector: [
      relations.hypernym  || 0,  // slot 0: is-a
      relations.hyponym   || 0,  // slot 1: kind-of
      relations.holonym   || 0,  // slot 2: part-of
      relations.meronym   || 0,  // slot 3: has-part
      relations.antonym   || 0,  // slot 4: opposite
      relations.similar   || 0,  // slot 5: similar-to
      relations.entailment|| 0,  // slot 6: implies
      relations.derivation || 0, // slot 7: derived-from
      relations.domain    || 0,  // slot 8: domain
      relations.registers  || 0, // slot 9: register
    ],
    stability: Math.min(1, relationCount / MIN_RELATIONS)
  };
}
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/prolog-inference.test.js` | Direct identity unification, transitive Horn clause, Fano ceiling (k > 14 → reject) |
| `test/prolog-wordnet-broker.test.js` | Fact parser, Fano token round-trip, service bus routing frame |
| `test/semantic-memory-broker.test.js` | Lemma ingest, HNSW search, temporal slot storage |
| `test/wordnet-centroid.test.js` | Centroid creation from mock records, relation vector, CIDR metric |
| `test/axiomatic.test.js` | RULES.omi / FACTS.omi loading, segment-based query, exact/matchMask |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x62**: Fano selectors LL 0x01..0x07 define primitive WordNet semantic relations
- **Rule 0x63**: Prolog unification MUST use pure bitwise masks, zero allocation
- **Rule 0x64**: Recursive resolution MUST close in ≤14 steps

### Extension points

- **New relation types**: Extend the 10-slot centroid vector with additional WordNet relations (e.g., `causes`, `substance-meronym`). Update `makeWordNetCentroid` to populate the new slot.
- **Custom Horn clause chain**: Implement a new `_resolveTransitive` variant that uses a different traversal strategy (e.g., bidirectional search) for faster lookups on dense rings.
- **Additional Prolog fact files**: Add `.pl` files to `src/wordnet/facts/` and load them via the Prolog broker. The axiomatic kernel auto-discovers new files.

### Performance constraints

- `_scanIdentity` scans 5040 slots in worst case — each iteration is a single `Atomics.load` (BigInt64) + 3 comparisons.
- `_resolveTransitive` is bounded to 14 recursive steps (Fano ceiling). Each step scans up to 5040 slots.
- The Prolog broker loads WordNet facts once at startup (~1400ms for full WordNet 3.0). After loading, all lookups are O(1) dictionary access.
