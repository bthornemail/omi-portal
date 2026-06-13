# AGENTS

This repository is the root OMI Portal workspace. Treat it as the canonical implementation branch.

The First Principle of the OMI Protocol is defined in `docs/agreement-is-all-you-need.md` — agreement as constructive alignment, disagreement as an unresolved file path, and the collaboration doctrine that turns shared intelligence into executable structure.

## Ground Rules

- Preserve the existing POS graph channel behavior.
- Preserve WordNet synset cells as semantic centroid identity.
- Add OMI projection and indexing as a bridge layer, not as a replacement for existing graph semantics.
- Keep `dev-docs/` as source/reference material. Do not copy transcript content wholesale into canonical docs.
- Treat `demos/` as reference-only snapshots unless a root artifact is truly missing.
- Do not rewrite `chat.history.html`.
- Maintain the document layer ordering: POSTULATES.md (construction) → AXIOMS.md (folding) → DECLARATIONS.md (derivation). Preserve the Euclidean/origami/declaration architecture.

## Core Axioms (OMI = Omicron Object Model)

- **Ο** (U+039F) = cardinal boundary operator / zero-frame / gauge closure / frame boundary
- **ο** (U+03BF) = chiral execution operator / local cons transition
- `Ο-<car>-<cdr>` = Omi cons pair (car = control/boundary, cdr = payload/continuation)
- `.imo` compiled records wrap with **ο** (U+03BF) as entry delimiter and **Ο** (U+039F) as exit delimiter, mirroring S1/S6 in the 128-bit wire frame
- `δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C` = bitwise cons transition (period-8)
- `--` = relational bridge / omi---imo cell join
- `/N` = relational descent path (0–128, `/4` canonical local frame); CIDR `/N` is adapter-only
- `60` = sexagesimal place-value clock (Hellenistic digit bound 0–59)
- `240 = 4×60` public projection lattice
- `360 = 6×60` orientation field
- `720 = 2×360` / `6!` mirrored orientation
- `5040 = 7!` master Fano permutation cycle
- `Inv(x) = x ⊕ 0x5A3C` = central inversion bitwise mirror (balanced symmetry under prime ideal 73)
- `()! = ()` = empty-cons identity law (the fixed point); `0! = 1` is the numeric form
- `() ≠ ()!` = syntactic distinction between value (state) and operation (transition)
- `!` = execution suffix / cons closure trigger
- Factorial lattice: `0!→1→2!→2→3!→6→4!→24→5!→120→6!→720→7!→5040`

## Current Canonical Roots

- Address root: `ffff-127-0-0-1` (no `omi-` alias; canonical is `ffff-127--/48`); relational descent form: `ο<ffff><127><0><0><1>Ο`
- Omi-Plane Capsule spec: `docs/omi-plane-capsule.md` (supplementary Unicode encapsulation layer)
- Omi-Gauge Autonomous Function Space: `docs/omi-gauge-autonomous-function-space.md` (computed rows, pure functions, 0xAA55 acceptance seal)
- Omi-Nomogram/SlideRule/Query Plane: `docs/omi-nomogram.md` (deterministic function scales, post-address payloads, ?---? surface)
- OmiPipe/MCRSGSP layer alignment: `docs/omi-pipe-mcrsgsp-alignment.md` (streaming frames, erasure-coded fragments, receipt authority)
- Main framework doc: `docs/omi-object-model.md`
- Omi-Notation spec: `docs/omi-notation.md`
- Construction doc: `POSTULATES.md` (Euclidean layer — what may be constructed)
- Fold doc: `AXIOMS.md` (origami layer — how objects may be folded, reflected, transformed)
- Derivation doc: `DECLARATIONS.md` (how RULES.omi clauses become FACTS.omi rows)
- Manifest: `docs/10-declaration/omi-object-model.manifest.json`
- GUI files: `public/document.html`, `public/aframe.html`, `public/bidi.html`, `public/inbox.html`, `public/arg.html`
- Consolidated canon v0: `docs/omi-native-gauge-consolidated-canon.md` (final realignment: CIDR retired from native grammar, two-cube mirrors, factorial row gauge, PPP escape grammar, regular geometry predicates, Fano/trigintaduonion incidence, HNSW runtime measurement, 11-cell/buckyball shell, sexagesimal degree inspection)
- CIDR kernel (historical adapter): `src/omi/omicron-kernel.js`
- Sexagesimal kernel: `src/omi/sexagesimal-kernel.js`
- Inversion kernel: `src/omi/inversion-kernel.js`
- Lisp kernel: `src/omi/lisp-kernel.js`
- Lattice kernel: `src/omi/lattice-kernel.js`
- Hopf fibration kernel: `src/omi/hopf-kernel.js`
- Octonion Fano kernel: `src/omi/octonion-kernel.js`
- Sphere packing kernel: `src/omi/sphere-packing.js`
- JAB Code scrambler: `src/canvas/jab-scrambler.js`
- Code 16K kernel: `src/canvas/code16k-kernel.js`
- Neural activation kernel: `src/omi/neural-kernel.js`
- Polytopic neural kernel: `src/omi/polytopic-neural.js`
- HGV kernel: `src/omi/hgv-kernel.js`
- HGV binary64 perceptron: `src/omi/hgv-perceptron.js`
- Page framer kernel: `src/canvas/page-framer.js`
- Emoji feature kernel: `src/omi/emoji-feature.js`
- Emoji data kernel: `src/omi/emoji-data.js`
- Emoji canvas kernel: `src/canvas/emoji-canvas.js`
- Megatron kernel: `src/omi/megatron-kernel.js`
- Monster Group supersingular kernel: `src/omi/monster-kernel.js`
- Hellenistic astro kernel: `src/omi/astro-kernel.js`
- Supersingular elliptic kernel: `src/omi/elliptic-kernel.js`
- Metacircular perceptron kernel: `src/omi/metacircular-perceptron.js`
- Sexagesimal router kernel: `src/canvas/sexagesimal-router.js`
- STS benchmark evaluator kernel: `src/omi/sts-evaluator.js`
- FACTS Parametric evaluator kernel: `src/omi/facts-evaluator.js`
- Wikimedia Steiner triple kernel: `src/omi/wikimedia-kernel.js`
- Cluster discovery mesh kernel: `src/omi/cluster-discovery.js`
- OmiLog compiler: `src/omilog/omi-imo-compiler.js` (`.omi` → `.imo` lowering)
- Omilog multiplex: `src/omilog/multiplex.js` (LL/MM/NN frame packing)
- Omilog barrel: `src/omilog/index.js`
- Rule 0x8B: `wrap-imo-records-with-omicron-delimiters` — compiled `.imo` uses ο/Ο
- Rule 0x8C: `align-imo-delimiters-with-wire-frame-omicron-constants` — S1/S6 mirror
- Rule 0x8D: `derive-fano-lottery-from-canonical-kernel-state` — slot5040 = fano7×720 + role3×240 + local240
- Rule 0x8E: `derive-sexagesimal-logic-clock-from-delta-replay` — Δ period-8 → sexagesimal clock
- Rule 0x8F: `preserve-lower-and-upper-omicron-dataflow-chirality` — ο chiral entry, Ο cardinal closure
- Rule 0x90: `sequence-before-qxy-projection` — validity → sequencing → projection
- Rule 0x91: `preserve-even-and-odd-factorial-branches` — odd select, even project, upper operate
- Rule 0x92: `apply-9-through-12-factorials-as-meta-operator-shell` — upper shell acts on both branches
- Rule 0x93: `preserve-32-state-native-operator-basis` — 0x00..0x1F = 32 hidden/control operator positions
- Rule 0x94: `treat-32-ion-model-as-analogy-until-tested` — structural, not arithmetic, authority
- Rule 0x95: `map-trigintaduonion-process-to-omi-operator-basis` — 32-state operator scaffold from trigintaduonion e0..e31
- Rule 0x96: `derive-omi-operator-interactions-from-32-by-32-process-table` — 1024-cell operator composition table
- Rule 0x97: `route-spo-incidence-through-155-distinguished-triads` — 155 triads partitioned into five OMI file categories
- Rule 0x98: `map-64-ion-doubling-to-full-imo-native-plane` — 64-position native plane from 64-ion doubling pattern
- Rule 0x99: `generate-every-closed-omi-region-from-one-principal-pointer` — OPPID: every region has one principal generator
- Rule 0x9A: `derive-common-generator-for-paired-omi-pointers` — common CIDR/LL/closure generator from two pointers; note: CIDR is adapter-only, native form is relational descent
- Rule 0x9B: `witness-shared-closures-through-combinator-composition` — Bézout-style witness composition (SHOULD)
- Rule 0x9C: `decompose-finite-omi-record-sets-into-cyclic-replay-components` — cyclic replay decomposition (SHOULD)
- Rule 0x9D: `separate-compilation-targets-into-development-consumer-and-production-grades` — Makefile grade lifecycle isolation (MUST)
- Rule 0x9E: `execute-the-twelve-step-pipeline-via-canonical-makefile-targets` — Makefile automates the 13-step OMI pipeline (MUST)
- Rule 0x9F: `parse-o-expression-streams-from-imo-payload-blocks` — O-Expression reader parses .imo payload blocks as structured O-expressions (MUST)
- Rule 0xA0: `connect-live-proxy-events-to-omi-reader-pipeline` — NAT64/SSE events validated and parsed through reader before projection (MUST)
- Rule 0xA1: `project-live-network-events-through-qxy-voxel-state` — Parsed events project through Q_xy to produce voxel state diffs (MUST)
- Rule 0xA2: `bind-live-portal-voxels-through-custom-dom-events` — Portal binder bridges EventSource SSE → CustomEvent voxel dispatch into browser torus (MUST)
- Rule 0xA3: `compile-narratives-into-persistent-world-models` — Narrative world model compiles story into persistent symbolic terrain (MUST)
- Rule 0xA5: `preserve-open-world-state-across-noninteraction` — World clock continues ticking when no interaction (MUST)
- Rule 0xA6: `open-selector-ui-at-narrative-interaction-gates` — Gate opens on touch, closes on timeout (MUST)
- Rule 0xA7: `resume-autonomous-world-stepping-after-interaction-timeout` — Clock resumes after gate timeout (MUST)
- Rule 0xAA: `weight-canonical-narrative-triples-with-sexagesimal-centroid-ratios` — Sexagesimal regular fractions as exact centroid weights for tetrahedral agreement (MUST)
- Rule 0xAB: `distinguish-regular-extraction-weights-from-repeating-replay-cadences` — Regular 2,3,5-denominator weights vs repeating 7,11,13,17,19,59,61 cadences (MUST)
- Rule 0xAC: `encode-creation-step-inside-omicron-address-before-prefix-or-lens-claims` — The Omicron frame alone encodes step identity; prefixes/lenses do not add identity (MUST)
- Rule 0xAD: `treat-prefixes-and-lenses-as-claim-reduction-not-authority` — `/N` = CIDR claim boundary, `/@N` = reader lens; neither creates validity (MUST)
- Rule 0xAE: `distinguish-cidr-claim-prefixes-from-at-marked-reader-lenses` — Three-way distinction: `/N` claim, `/N-M` backoff, `/@N` lens; the lens stack never creates identity (MUST)
- Rule 0xB8: `encode-lower-stack-through-omicron-symbol-chirality` — Lower stack even-tick → ο, odd-tick → Ο (MUST)
- Rule 0xB9: `encode-upper-stack-through-unicode-bidi-cosmetic-reader-lens` — Upper stack even-tick → ltr, odd-tick → rtl (MUST)
- Rule 0xBA: `separate-delta-law-tick-from-lens-projection` — Delta Law is sole clock authority; symbol and lens are projections (MUST)
- Rule 0xBB: `recover-cosmic-orbit-through-base36-digmod36` — digmod 36 recovers orbital cell, 5040-cycle wraps celestial layers (MUST)
- Rule 0xBC: `route-regular-denominators-through-stable-synchronization` — Regular 2^a×3^b×5^c denominators → stable-sync (MUST)
- Rule 0xBD: `route-repeating-denominators-through-cyclical-replay` — Malevolent prime denominators → replay-loop; 59/61 twin-prime boundary; irrational mode-switch (MUST)
- Rule 0xBE: `execute-orbit-offset-recovery-via-thirty-six-count-color-carrier-divmod` — divmod(0xRRGGBBAA, 36) recovers orbit/offset; even → 73/regular, odd → 37/cosmetic (MUST)
- Rule 0xBF: `map-incidence-relations-to-eight-point-six-circle-miquel-configurations` — Miquel (8₃ 6₄) maps 8 cube vertices to lower ≤8! stack, 6 faces to upper 9!–12! shell (MUST)
- Rule 0xC0: `route-terminating-fractions-and-hex-colors-through-lower-structural-canvas-body` — #RRGGBB hex = lower exact structural body (MUST)
- Rule 0xC1: `route-repeating-fractions-and-canvas-preset-colors-through-upper-reader-shell` — "1"–"6" preset keys = upper cosmetic reader aliases (MUST)
- Rule 0xC2: `preserve-json-canvas-geometry-as-structural-state-while-treating-color-presets-as-reader-lenses` — Field-level split; geometry stays structural, color stays cosmetic (MUST)
- Rule 0xC3: `encode-json-canvas-color-addresses-as-rrggbbaa-seeds` — 24-bit RRGGBB body + 8-bit AA attachment = 32-bit seed (MUST)
- Rule 0xC4: `recover-json-canvas-color-orbits-through-divmod-rrggbbaa-by-thirty-six` — orbit = floor(seed/36), offset = seed mod 36 (MUST)
- Rule 0xC5: `reserve-thirty-seven-as-aa-mode-switch-outside-base36-offsets` — AA=37 triggers Omicron mode switch, never collides with Base36 0..35 (MUST)
- Rule 0xC6: `map-json-canvas-rgb-color-cube-through-eight-vertex-six-face-incidence` — 8 RGB vertices × 3 faces = 24 Miquel incidences (MUST)
- Atomic kernel: `src/omilog/atomic-kernel.js` (`deltaTick`, `encodeLowerChirality`, `encodeUpperChirality`, `evaluateAtomicDual`)
- Cosmic orbit recovery: `src/omilog/cosmic-orbit.js` (`digmod36`, `recoverCosmicOrbit`, `applyCosmeticReaderLens`)
- Sexagesimal reciprocal router: `src/omilog/reciprocal-router.js` (`OmiReciprocalRouter`, `evaluateFractionalGrade`, `processSynchronizedState`)
- Miquel router: `src/omilog/miquel-router.js` (`OmiMiquelRouter`, `recoverColorOrbit`, `compileMiquelVoxel`, `getMiquelConfiguration`)
- Canvas color router: `src/canvas/omi-canvas-color-router.js` (`classifyCanvasColor`, `routeCanvasColor`, `isLowerHexColor`, `isUpperPresetColor`)
- JSON Canvas OMI router: `src/canvas/json-canvas-omi-router.js` (`routeCanvasNode`, `routeCanvasEdge`, `buildOmiCanvas`, `sideToTangent`)
- JSON Canvas address schema: `src/canvas/json-canvas-address-schema.js` (`parseRgbHex`, `classifyCanvasColorAuthority`, `composeRRGGBBAA`, `buildOmiGraph`)
- RRGGBBAA orbit kernel: `src/canvas/rrggbbaa-orbit.js` (`recoverRRGGBBAAOrbit`, `composeRRGGBBAAOrbit`, `isAAModeSwitch`)
- Miquel RGB incidence: `src/canvas/miquel-rgb-incidence.js` (`buildMiquelRgbIncidence`, `validateMiquelRgbIncidence`, `getVerticesOnFace`)
- Reader module: `src/omilog/reader.js`
- Lens parser: `src/omilog/omi-lens-parser.js` (`readOExpression`, `readImoPayloadBlock`, `isEmojiAtom`, `isOmiAddressAtom`)
- NAT64 virtual adapter: `src/wan/nat64-virtual-adapter.js` (IPv4 → OMI address mapping, simulated .imo events)
- Proxy event connector: `src/wan/proxy-event-connector.js` (`ProxyEventConnector` class, SSE subscription, reader integration)
- Live voxel stream: `src/canvas/live-voxel-stream.js` (`LiveVoxelStream` class, Q_xy projection, TTL, voxel state diffs)
- Live portal binder: `src/wan/live-portal-binder.js` (`OmiLivePortalBinder` class, EventSource SSE bridge, CustomEvent voxel dispatch)
- Narrative base: `src/narrative/narrative-base.js` (CANONICAL_ORDER, classifyDocument, parseNarrativeDocument, loadNarrativeFromMap; no Node deps, browser-safe)
- Narrative loader: `src/narrative/narrative-loader.js` (re-exports from narrative-base.js, adds loadNarrativeFromDisk with readFileSync)
- Narrative series loader: `src/arg/narrative-series-loader.js` (loadNarrativeSeries, createSeriesContentMap, extractMotifs, MOTIF_KEYWORDS, getPhaseEmoji/Color)
- Narrative movie timeline: `src/arg/narrative-movie-timeline.js` (createBeat, createScene, buildTimeline, findBeatsByMotif)
- Narrative scene compiler: `src/arg/narrative-scene-compiler.js` (compileBeatToTopology, compileBeatToEntities, compileSceneToTopology)
- ARG movie player: `src/arg/arg-movie-player.js` (ArgMoviePlayer class, play/pause/next/prev/seek/scrub, beat/scene callbacks)
- Narrative document pipeline: `src/narrative/narrative-document-pipeline.js` (load → extract motifs → assign emoji → insert into PersistentWorldState; motif keywords/emoji maps; open Narrative Gate + Number vs Meaning tension)
- Emoji notation map: `src/narrative/emoji-notation-map.js` (14 actor emoji carriers, UPOS emoji, keyword matching)
- Persistent world state: `src/world/persistent-world-state.js` (`PersistentWorldState` class, tick/epoch, actor/relation/tension/gate lifecycle)
- Makefile grade router: `dev` (development), `consumer` (readable package), `production` (compiled artifacts), `verify-safe` (non-eBPF gates)
- Build integrator: `scripts/oppid-coherence-check.js` — walks FACTS.omi/RULES.omi to verify OPPID generator discipline
- OMI compiler CLI: `scripts/compile-omi.js` — lowers `.omi` source to `.imo` compiled objects with Omicron delimiters
- Emoji test data: `vendor/emoji/emoji-test.txt`
- Emoji sequences: `vendor/emoji/emoji-sequences.txt`
- Emoji ZWJ sequences: `vendor/emoji/emoji-zwj-sequences.txt`
- Aztec barcode spec: `vendor/barcodes/The Aztec Slide Rule - A Complete Polyform Library Specification.md`
- Aztec patent: `vendor/barcodes/Aztec.US5591956A.pdf`
- BeeTag paper: `vendor/barcodes/BeeTag.pone.0136487.pdf`
- MaxiCode patent: `vendor/barcodes/MaxiCode.US4998010.pdf`
- USS-16K spec: `vendor/barcodes/USS-16K.pdf`

## Implementation Expectations

- Prefer reusable source modules under `src/` over inline GUI-only logic.
- Keep browser GUIs lightweight and wired to exported helpers.
- Use native DOM `dataset` and CSSOM selectors as the filtering/display source of truth when possible.
- Keep speculative WebRTC, CoTURN, HNSW, CodeMirror, Prolog runtime, and WebGL surfaces clearly labeled unless they are implemented locally.
- Add tests for parser, manifest, compiler, and deterministic indexing changes.

## Verification

Run these before handing off implementation changes:

```bash
make verify-safe          # primary: docs + Omilog + OPPID + build (non-eBPF, daily green)
make verify-ebpf          # eBPF kernel gate (requires clang + bpftool)
npm test                  # full test suite (1736+ tests)
npm run build
```

For GUI changes, also run Vite and smoke the affected public page:

```bash
npm run dev
```

## Production Pipeline

For a full CI/CD pipeline verification (multi-arch QEMU tests, Docker smoke test):

```bash
make test                   # unit tests
make docker-build           # multi-arch buildx bake (requires Docker + QEMU binfmt)
make qemu-test              # QEMU cross-arch tests via Docker
make release-dry-run patch  # dry-run release (no push)
make release patch          # full release (tag, multi-arch build, push to GHCR)
```

### CI Pipeline (GitHub Actions)

- `.github/workflows/ci.yml` — on push/PR to main: unit tests + QEMU multi-arch matrix (linux/amd64, arm64, arm/v7) + Docker smoke test with COOP/COEP verification
- `.github/workflows/release.yml` — on `v*` tag: multi-arch bake and push to container registry with provenance attestation + GitHub Release

### Docker Architecture

- `Dockerfile` — Multi-stage: `base` (npm ci) → `test` (npm test) → `builder` (npm run build) → `runtime` (nginx, non-root `omi` user, COOP/COEP, HEALTHCHECK)
- `Dockerfile.qemu` — Multi-arch test container for `--platform linux/amd64|arm64|arm/v7`
- `docker-bake.hcl` — Buildx bake matrix with GHA cache, provenance attestation, and release tag variants
- `Dockerfile.softmmu` — QEMU full-system emulator suite (x86_64, i386, aarch64, riscv64, ppc64, mips64)
