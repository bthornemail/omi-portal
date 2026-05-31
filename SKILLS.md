# SKILLS

This file records the repeatable project workflows used in the OMI Portal.

## Documentation Declaration

Use when turning exploratory `dev-docs/` material into canonical framework docs or adding root-layer specs.

1. Root-layer documents live at project root: `POSTULATES.md` (construction), `AXIOMS.md` (fold axioms), `DECLARATIONS.md` (derivation).
2. Add or update curated Markdown in `docs/`.
3. Update `docs/omi-object-model.manifest.json` with stable machine-readable declarations.
4. Update `docs/source-map.md` when a new source document contributes concepts.
5. Add or extend documentation integrity tests.
6. Run `npm test` and `npm run build`.

## OMI Parser Or Index Work

Use when changing `omi-*`, `omi-fano-*`, or `*.omi` token behavior.

1. Keep canonical output deterministic.
2. Accept documented deprecated forms only through explicit compatibility paths.
3. Validate bounds such as RS `0x00..0x3f`, US `0x00..0x7f`, Fano `p1..p7`, slot `0..5040`, and 9-byte synset ids.
4. Add parser rejection tests for malformed inputs.

## DOM/CSSOM GUI Work

Use when changing `public/document.html`.

1. Compile through `compileTextToAnimatedDocument()`.
2. Build registry/index data through exported helpers.
3. Apply OMI metadata as `data-omi-*` attributes.
4. Filter by native dataset and CSS-hidden state.
5. Preserve generated atom markup and animation behavior.

## A-Frame WordNet Work

Use when changing `public/aframe.html`.

1. Keep the scene as the canonical 3D GUI.
2. Query local `vendor/prolog/wn_*.pl` data through the JavaScript Prolog WordNet broker.
3. Render synsets as entities with `data-omi`, `data-omi-service`, operator, synset, centroid, and cell metadata.
4. Keep v1 scoped to a deterministic JS fact broker, not a live Prolog runtime.

## CodeMirror BiDi Work

Use when changing `public/bidi.html` or `src/bidi/`.

1. Treat CM6 transactions as the input stream.
2. Keep BiDi marks and DataView/SAB behavior deterministic.
3. Surface state through DOM attributes so CSSOM can react without replacing the editor.
4. Test pure engine behavior separately from browser-only UI behavior.

## Document Architecture Work

Use when defining or revising the root-layer document stack (POSTULATES → AXIOMS → DECLARATIONS → RULES.omi → FACTS.omi).

1. POSTULATES.md defines *construction permissions* — what may be built (points, lines, surfaces, rules, facts, transitions, masks, proofs, replays, projections, complements).
2. AXIOMS.md defines *fold transformations* — how constructed objects may be reflected, aligned, complemented, resolved (O1–O13 + Ones-Complement Law).
3. DECLARATIONS.md defines *derivation* — how RULES.omi clauses become FACTS.omi rows via a-list transitions, bitboard masks, and bitblip corrections.
4. Every address point must trace through the full chain: construct → rule → fact → fold → declare → test → replay → project.
5. Run `make compile-ebpf-gate && npm test && npm run build` to verify.
