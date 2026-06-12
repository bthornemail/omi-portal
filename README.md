# OMI Portal

OMI Portal is the implementation workspace for the Omicron Object Model: a protocol runtime for turning addresses, packets, documents, clocks, browser pages, and receipt streams into verifiable reference states.

This repository is being prepared for outside protocol review. Treat the root doctrine, native gauge canon, and declarative roots as the shared authority:

```text
AGENTS.md
-> DOCTRINE.md
-> docs/omi-native-gauge-consolidated-canon.md
-> POSTULATES.md -> AXIOMS.md -> DECLARATIONS.md
-> RULES.omi / FACTS.omi / CLOSURES.omi / COMBINATORS.omi / CONS.omi
-> source, tests, receipts, and browser projections
```

`README.md` is the stable entrypoint, not the release ledger. Changing counts, release snapshots, and audit evidence belong in [CHANGELOG.md](CHANGELOG.md), [RELEASE_NOTES.md](RELEASE_NOTES.md), and [dev-docs/AUDIT.md](dev-docs/AUDIT.md).

Use these gates to verify the current checkout:

```text
npm test
npm run build
make verify-safe
make qemu-test           requires a Docker-authorized shell
make docker-build        requires a Docker-authorized shell
```

## Start Here

For a short local or Docker walkthrough, read [OPEN_PORTAL.md](OPEN_PORTAL.md).
For remote reviewer testing, read [REMOTE_TESTING.md](REMOTE_TESTING.md).
For terminology, read [GLOSSARY.md](GLOSSARY.md).

Protocol reviewers should read in this order:

1. [MANIFESTO.md](MANIFESTO.md) — why notation, representation, and interpretation collapse into one protocol surface.
2. [DOCTRINE.md](DOCTRINE.md) — OMI as rewrite topology and lawful receipt flow.
3. [docs/omi-native-gauge-consolidated-canon.md](docs/omi-native-gauge-consolidated-canon.md) — current native gauge, receipt, and CIDR-retirement canon.
4. [docs/README.md](docs/README.md) — layer-organized map of the specification set.
5. `RULES.omi` and `FACTS.omi` — normative obligations and implemented facts.

## Current Rewrite Identity

The native OMI identity is the binary rewrite cell:

```text
omi---imo
```

The slash path is where interpretation routing happens:

```text
omi-<frame>-imo/<control>/<scale>/<relation>/<unit>
```

The slash path is not storage and not identity. It declares how to read the binary rewrite identity.

Payload or stream attachment uses the query surface:

```text
omi-<frame>-imo/<control>/<scale>/<relation>/<unit>?<payload>
```

The current address root is:

```text
ffff-127-0-0-1
canonical relational form: ffff-127--/48
stream form: ο<ffff><127><0><0><1>Ο
```

Eight-segment forms still exist as adapter and compatibility tokens for IPv6, legacy DOM ids, compiler fixtures, and network tests:

```text
omi-<s0>-<s1>-<s2>-<s3>-<s4>-<s5>-<s6>-<s7>/<claim>
```

In that adapter form, each segment is a 16-bit carrier word and `/claim` is a claim boundary. It does not create identity. Per Rules 0xAC-0xAE, identity is the Omicron rewrite cell; prefixes and lenses reduce claims or reader views.

## What OMI Provides

OMI is designed so humans and machines can ask:

```text
What is this?
Where does it belong?
What rule validates it?
What runtime owns it?
Can it be replayed, verified, or rejected?
```

An OMI state is useful only when the chain is complete:

```text
pointer -> rule -> implementation -> test -> receipt/projection
```

That chain lets a pointer act as:

- a network frame
- a memory receipt
- a semantic reference
- a JSON Canvas node id
- a CSSOM selector target
- a QEMU clock state
- an eBPF packet signature anchor
- a page-framing boundary
- an OmiPipe receipt

## Omicron Frame And Chirality

OMI uses Omicron as dataflow structure:

```text
Ο  upper Omicron, U+039F, cardinal boundary / gauge closure
ο  lower omicron, U+03BF, chiral execution / local transition
Ο-<car>-<cdr>  Omi cons pair
```

Compiled `.imo` records wrap with `ο` as entry delimiter and `Ο` as exit delimiter. This mirrors the S1/S6 constants in the 128-bit wire frame and preserves lower/upper dataflow chirality.

The bitwise cons transition is:

```text
δ_C(x) = rotl(x,1) xor rotl(x,3) xor rotr(x,2) xor C
```

It is period-8 and feeds the sexagesimal logic clock.

## Declarative Core

The OMI Declarative Core has five root files:

```text
RULES.omi declares normative invariants.
FACTS.omi grounds implemented facts.
CLOSURES.omi declares completion and boundedness conditions.
COMBINATORS.omi declares lawful composition operators.
CONS.omi declares pairing, nesting, dot-notation, and palindromic meta-circular structures.
```

Generated router seed configs live under `vectors/`. They reduce through CONS and provide POS, Universal Feature, and WordNet-Prolog proxy routes. They are generated routing material, not new authority roots.

```text
RULES declare.
FACTS ground.
CLOSURES seal.
COMBINATORS compose.
CONS reduce.
vectors/*.omi route through CONS.
```

The document layer ordering is fixed:

```text
POSTULATES.md     construction
AXIOMS.md         folding and transformation
DECLARATIONS.md   derivation into FACTS.omi rows
```

## Implemented Runtime Surfaces

The core implementation currently connects:

- Omilog parser, reader, and `.omi` -> `.imo` compiler.
- OPPID generator discipline and closure checks.
- Router seeds for POS, Universal Features, and WordNet-Prolog bridges.
- OmiPipe receipt ladder with network, MCRSGSP, causal, RS, and GF(256) proof layers.
- Browser surfaces for portal, document inspection, BiDi/CodeMirror, CSSOM, JSON Canvas, and demo-only A-Frame.
- WAN/live portal event path through NAT64 adapter, proxy connector, voxel stream, and portal binder.
- Narrative/world model pipeline with persistent world state, gates, clocks, and motif extraction.
- eBPF/XDP packet gate artifacts where local tooling permits.
- QEMU and Docker verification gates where the shell has Docker authority.

## Research Assimilation Boundaries

Research drafts in `dev-docs/_temp/` are an inbox, not canonical authority. A draft graduates only when a small invariant is restated in canonical docs, grounded in `RULES.omi` / `FACTS.omi`, and covered by tests.

Promoted invariants include:

```text
240 = 2×5! = 15×16 = 6!/3
slot5040 = fano7×720 + role3×240 + local240
5! = hidden packet root
4! = visible selector/fact projection surface
8!..12! = interpretive envelopes around the same 128-bit frame
```

Symbolic character encoding is projection-only. Base36 displays W=36 orbit offsets and fixed bridge readings:

```text
120 = 3C
240 = 6O
24 = O
720 = K0
5040 = 3W0
```

Emoji carriers are grounded in vendored Unicode emoji data and carry deterministic RGB/base64/row/col canvas metadata. They do not generate OMI law or replace `RULES.omi`, `FACTS.omi`, or native gauge identity.

The quadratic boundary is split:

```text
Q_frame(S) validates the 128-bit OMI envelope.
Q_xy(x,y) projects decoded state into geometry.
Q_xy(x,y) = 60x² + 16xy + 4y²
```

Symbols project the law. Symbols do not create the law.

Color/clock research is deterministic software visualization. OMI may map clock, precision, and receipt state to JSON Canvas color fields, but optical-clock language is only an analogy unless a local source module and test prove the behavior.

MCRSGSP is provenance for implemented distributed pieces: Reed-Solomon erasure coding, causal closure, version vectors, gossip propagation, fragment storage, and anti-entropy repair. MCRSGSP provides recoverable candidates. OMI decides accepted objects. Transport deployment and WAN behavior remain provisional unless wired to local tests.

## Verification

Install dependencies:

```bash
npm install
```

Run the primary gates:

```bash
make verify-docs
npm test
npm run build
make verify-safe
```

Run optional host-dependent gates:

```bash
make verify-ebpf
sg docker -c 'make qemu-test'
sg docker -c 'make docker-build'
```

`verify-ebpf` requires clang/BPF tooling and may fall back when kernel pinning is unavailable. Docker and QEMU gates require an active Docker-authorized shell and registered QEMU binfmt support.

## Review And Contribution Path

For protocol review:

1. Check the doctrine chain: `DOCTRINE.md`, native gauge canon, and the five declarative roots must agree.
2. Check traceability: every strong claim should point to a rule, fact, implementation, test, or clearly marked prospectus.
3. Check adapters: CIDR, IPv6, DOM ids, and CSS selectors are compatibility/projection surfaces unless a canonical rule says otherwise.
4. Check runtime status: implemented, generated, demo-only, prospectus, and historical material must be labeled.
5. Check verification: `make verify-docs`, `npm test`, `npm run build`, and `make verify-safe` should pass before publication.

For implementation work, prefer reusable modules under `src/`, lightweight browser wiring in `public/`, and focused tests for parser, manifest, compiler, indexing, receipt, and deterministic projection changes.

## Directory Map

```text
docs/          canonical specification and layer documents
dev-docs/      developer/reference indexes and audit ledger
public/        browser surfaces
src/           implementation modules
test/          regression tests and fixtures
vectors/       generated router seed configs
vendor/        vendored reference material
```

Protected boundaries:

- Do not copy transcript material wholesale into canonical docs.
- Do not rewrite `chat.history.html`.
- Treat `dev-docs/_temp/` as research inbox material.
- Treat demos as reference-only unless a root artifact is truly missing.
